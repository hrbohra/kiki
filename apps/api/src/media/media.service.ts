import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { WorldService } from '../world/world.service';
import { actingMemberId } from '../common/actor';
import { processImage } from './image';
import { STORAGE, type StorageProvider } from './storage';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly world: WorldService,
    @Inject(STORAGE) private readonly storage: StorageProvider,
  ) {}

  /** Process + store an uploaded image under the user's folder; returns the public URL. */
  async upload(userId: string, file: { buffer: Buffer; mimetype: string }): Promise<{ url: string }> {
    if (!file?.buffer?.length) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No file provided.' });
    if (file.buffer.length > MAX_BYTES) throw new TRPCError({ code: 'BAD_REQUEST', message: 'File too large (max 8 MB).' });
    if (!file.mimetype?.startsWith('image/')) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only image uploads are allowed.' });
    }
    const processed = await processImage(file.buffer, file.mimetype);
    const pathname = `${userId}/${randomUUID()}.${processed.ext}`;
    const stored = await this.storage.put(pathname, processed.data, processed.contentType);
    return { url: stored.url };
  }

  /** Set the acting member's avatar photo. */
  async attachAvatar(userId: string, url: string) {
    const memberId = await actingMemberId(this.prisma, userId);
    const member = await this.prisma.member.update({ where: { id: memberId }, data: { avatarUrl: url } });
    this.world.invalidate();
    return { id: member.id, avatarUrl: member.avatarUrl };
  }

  /** Set a listing's photo (host only). */
  async attachListingPhoto(userId: string, listingId: string, url: string) {
    const memberId = await actingMemberId(this.prisma, userId);
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found.' });
    if (listing.hostId !== memberId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the host can set this listing photo.' });
    }
    const updated = await this.prisma.listing.update({ where: { id: listingId }, data: { photoUrl: url } });
    this.world.invalidate();
    return { id: updated.id, photoUrl: updated.photoUrl };
  }
}
