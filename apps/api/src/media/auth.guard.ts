import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type SessionUser } from '../auth/auth.service';

export interface AuthedRequest extends Request {
  user?: SessionUser;
}

/** REST guard: authenticates via the Authorization: Bearer header and attaches req.user. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = this.auth.userFromAuthHeader(req.headers.authorization);
    if (!user) throw new UnauthorizedException('Sign in required.');
    req.user = user;
    return true;
  }
}
