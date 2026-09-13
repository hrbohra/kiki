import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const authRouter = router({
  /** Request an OTP. Existing email → login code; new email → requires a valid invite code. */
  requestOtp: publicProcedure
    .input(z.object({ email: z.string().email(), inviteCode: z.string().optional() }))
    .mutation(({ ctx, input }) => ctx.auth.requestOtp(input)),

  /** Verify the OTP; creates the account on first signup and returns access + refresh tokens. */
  verifyOtp: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
    .mutation(({ ctx, input }) => ctx.auth.verifyOtp(input)),

  /** Rotate a refresh token (with reuse detection). */
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.auth.refresh(input.refreshToken)),

  /** Revoke the session. */
  logout: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.auth.logout(input.refreshToken)),

  /** The current account (requires a valid access token). */
  me: protectedProcedure.query(({ ctx }) => ctx.auth.me(ctx.user.id)),
});
