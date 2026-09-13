import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { AuthModule } from '../auth/auth.module';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { AuthGuard } from './auth.guard';
import { STORAGE, LocalDiskStorage, VercelBlobStorage, type StorageProvider } from './storage';

/** Local uploads dir (served statically at /media by main.ts when using local storage). */
export const UPLOADS_DIR = join(process.cwd(), '.uploads');

const storageProvider = {
  provide: STORAGE,
  useFactory: (): StorageProvider => {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) return new VercelBlobStorage(token);
    const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.API_PORT || 4000}`;
    return new LocalDiskStorage(UPLOADS_DIR, base);
  },
};

@Module({
  imports: [WorldModule, AuthModule],
  controllers: [MediaController],
  providers: [MediaService, AuthGuard, storageProvider],
  exports: [MediaService],
})
export class MediaModule {}
