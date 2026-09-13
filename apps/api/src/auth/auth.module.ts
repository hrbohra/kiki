import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

@Module({
  providers: [AuthService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
