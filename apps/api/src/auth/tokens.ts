import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';

const ACCESS_TTL = '15m';
export const REFRESH_TTL_DAYS = 30;
export const OTP_TTL_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;

export interface AccessClaims {
  sub: string;
  email: string;
}

function accessSecret(): string {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error('JWT_ACCESS_SECRET is not set');
  return s;
}

export function signAccess(claims: AccessClaims): string {
  return jwt.sign(claims, accessSecret(), { expiresIn: ACCESS_TTL });
}

export function verifyAccess(token: string): AccessClaims {
  return jwt.verify(token, accessSecret()) as AccessClaims;
}

/** High-entropy opaque refresh token (only its hash is stored). */
export function newRefreshRaw(): string {
  return randomBytes(48).toString('base64url');
}

export function newFamilyId(): string {
  return randomBytes(16).toString('hex');
}

/** sha256 — fine for high-entropy tokens and attempt-limited short OTPs. */
export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** 6-digit numeric OTP. */
export function genOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function minutesFromNow(min: number): Date {
  return new Date(Date.now() + min * 60_000);
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}
