import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** DI token for the storage implementation. */
export const STORAGE = Symbol('STORAGE');

export interface StoredObject {
  url: string;
  pathname: string;
}

/** Storage port. Swapping local-disk ↔ Vercel Blob (↔ S3 later) needs no caller changes. */
export interface StorageProvider {
  put(pathname: string, data: Buffer, contentType: string): Promise<StoredObject>;
}

/** Local-disk storage for dev/single-server. Files land in .uploads and are served at /media. */
export class LocalDiskStorage implements StorageProvider {
  constructor(
    private readonly root: string,
    private readonly publicBase: string,
  ) {}

  async put(pathname: string, data: Buffer): Promise<StoredObject> {
    const full = join(this.root, pathname);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
    return { pathname, url: `${this.publicBase}/media/${pathname}` };
  }
}

/** Vercel Blob storage — the CDN-backed production path. Activated when BLOB_READ_WRITE_TOKEN is
 *  set. Uploads server-side and returns the public CDN URL. */
export class VercelBlobStorage implements StorageProvider {
  constructor(private readonly token: string) {}

  async put(pathname: string, data: Buffer, contentType: string): Promise<StoredObject> {
    const { put } = await import('@vercel/blob');
    const blob = await put(pathname, data, {
      access: 'public',
      token: this.token,
      contentType,
      addRandomSuffix: false,
    });
    return { pathname, url: blob.url };
  }
}
