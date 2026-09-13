import { Injectable, Logger } from '@nestjs/common';

/** Sends the passwordless OTP via Resend. In non-production it also logs the code so the flow
 *  is testable without a real inbox; it never logs in production. */
@Injectable()
export class EmailService {
  private readonly log = new Logger('EmailService');

  async sendOtp(email: string, code: string, purpose: string): Promise<void> {
    const key = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM || 'Kiki <onboarding@resend.dev>';
    const isDev = process.env.NODE_ENV !== 'production';
    const subject = 'Your Kiki code';
    const html =
      `<p>Your Kiki ${purpose} code is <strong style="font-size:20px;letter-spacing:2px">${code}</strong>.</p>` +
      `<p>It expires in 10 minutes. If you didn't request this, ignore this email.</p>`;

    if (!key) {
      if (isDev) this.log.warn(`[DEV OTP] ${email} -> ${code} (no EMAIL_API_KEY set)`);
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: email, subject, html }),
      });
      if (!res.ok) {
        const body = await res.text();
        if (isDev) this.log.warn(`[DEV OTP] ${email} -> ${code} (Resend ${res.status}: ${body})`);
        return;
      }
      if (isDev) this.log.log(`[DEV OTP] sent to ${email} -> ${code}`);
    } catch (err) {
      if (isDev) this.log.warn(`[DEV OTP] ${email} -> ${code} (send failed: ${String(err)})`);
    }
  }
}
