import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiter } from '../common/rate-limit';
import { EmailService } from './email.service';
import {
  daysFromNow,
  genOtp,
  hashToken,
  minutesFromNow,
  newFamilyId,
  newRefreshRaw,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MIN,
  REFRESH_TTL_DAYS,
  signAccess,
  verifyAccess,
} from './tokens';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  memberId: string | null;
  invitedById: string | null;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionUser {
  id: string;
  email: string;
}

const normEmail = (e: string): string => e.trim().toLowerCase();

function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    memberId: u.memberId,
    invitedById: u.invitedById,
    createdAt: u.createdAt,
  };
}

@Injectable()
export class AuthService {
  // Max 5 OTP requests per email per 15 minutes (in-memory; Redis-back for multi-instance).
  private readonly otpLimiter = new RateLimiter(5, 15 * 60 * 1000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /** Step 1: request a login (existing user) or signup (needs a valid invite) OTP. */
  async requestOtp(input: { email: string; inviteCode?: string }): Promise<{ ok: true; purpose: 'login' | 'signup' }> {
    const email = normEmail(input.email);
    if (!this.otpLimiter.check(email)) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many codes requested. Try again later.' });
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });

    let purpose: 'login' | 'signup';
    let inviteCode: string | null = null;

    if (existing) {
      purpose = 'login';
    } else {
      const code = input.inviteCode?.trim();
      if (!code) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'An invite code is required to join Kiki.' });
      }
      const invite = await this.prisma.invite.findUnique({ where: { code } });
      if (!invite || invite.claimedById || (invite.expiresAt && invite.expiresAt < new Date())) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'That invite code is invalid or already used.' });
      }
      purpose = 'signup';
      inviteCode = code;
    }

    const otp = genOtp();
    await this.prisma.otpToken.create({
      data: { email, codeHash: hashToken(otp), purpose, inviteCode, expiresAt: minutesFromNow(OTP_TTL_MIN) },
    });
    await this.email.sendOtp(email, otp, purpose);
    return { ok: true, purpose };
  }

  /** Step 2: verify the OTP. Creates the account on first signup (claiming the invite), then issues tokens. */
  async verifyOtp(input: { email: string; code: string }): Promise<{ user: PublicUser } & AuthTokens> {
    const email = normEmail(input.email);
    const token = await this.prisma.otpToken.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No active code — request a new one.' });
    if (token.attempts >= OTP_MAX_ATTEMPTS) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many attempts — request a new code.' });
    }
    if (token.codeHash !== hashToken(input.code)) {
      await this.prisma.otpToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Incorrect code.' });
    }
    await this.prisma.otpToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Signup: claim the invite and record the invite tree.
      const invite = token.inviteCode
        ? await this.prisma.invite.findUnique({ where: { code: token.inviteCode } })
        : null;
      if (!invite || invite.claimedById) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'That invite is no longer valid.' });
      }
      user = await this.prisma.user.create({ data: { email, invitedById: invite.createdById } });
      await this.prisma.invite.update({ where: { id: invite.id }, data: { claimedById: user.id } });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user, newFamilyId());
    return { user: publicUser(user), ...tokens };
  }

  /** Rotate a refresh token. Detects reuse of a revoked token and kills the whole family. */
  async refresh(refreshToken: string): Promise<{ user: PublicUser } & AuthTokens> {
    const rec = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!rec) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid refresh token.' });

    if (rec.revokedAt) {
      // Reuse of an already-rotated token ⇒ likely theft: revoke the entire family.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: rec.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session revoked (token reuse detected).' });
    }
    if (rec.expiresAt < new Date()) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Refresh token expired.' });
    }

    const tokens = await this.issueTokens(rec.user, rec.familyId, rec.id);
    return { user: publicUser(rec.user), ...tokens };
  }

  /** Log out: revoke the presented token's whole family. */
  async logout(refreshToken: string): Promise<{ ok: true }> {
    const rec = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
    if (rec) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: rec.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { ok: true };
  }

  /** Resolve the current user from an Authorization: Bearer <access> header. Null if absent/invalid. */
  userFromAuthHeader(header: string | undefined): SessionUser | null {
    if (!header?.startsWith('Bearer ')) return null;
    return this.userFromToken(header.slice(7));
  }

  /** Resolve the current user from a raw access token (used by the WebSocket transport, which
   *  passes the token via connectionParams rather than a header). Null if invalid. */
  userFromToken(token: string | undefined): SessionUser | null {
    if (!token) return null;
    try {
      const claims = verifyAccess(token);
      return { id: claims.sub, email: claims.email };
    } catch {
      return null;
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Account not found.' });
    return publicUser(user);
  }

  /** Issue an access token + a rotated refresh token in a family. If `replacesId` is given, that
   *  token is revoked and linked to the new one (rotation). */
  private async issueTokens(user: User, familyId: string, replacesId?: string): Promise<AuthTokens> {
    const raw = newRefreshRaw();
    const created = await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(raw), familyId, expiresAt: daysFromNow(REFRESH_TTL_DAYS) },
    });
    if (replacesId) {
      await this.prisma.refreshToken.update({
        where: { id: replacesId },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
    }
    const accessToken = signAccess({ sub: user.id, email: user.email });
    return { accessToken, refreshToken: raw };
  }
}
