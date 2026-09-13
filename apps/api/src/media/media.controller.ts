import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard, type AuthedRequest } from './auth.guard';
import { MediaService } from './media.service';

/** Binary upload endpoint (multipart). tRPC handles JSON; large file bytes go here instead. */
@Controller('media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @Req() req: AuthedRequest,
  ): Promise<{ url: string }> {
    return this.media.upload(req.user!.id, file as { buffer: Buffer; mimetype: string });
  }
}
