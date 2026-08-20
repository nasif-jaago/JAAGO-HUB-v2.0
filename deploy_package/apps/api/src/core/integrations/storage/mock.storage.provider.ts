import { randomBytes } from "node:crypto";
import type { StorageProvider, FileUploadPayload, FileUploadResult } from "./types.js";

export class MockStorageProvider implements StorageProvider {
  readonly name = "mock";
  private readonly files = new Map<string, { buffer: Buffer | Uint8Array; mimeType: string }>();

  async upload(payload: FileUploadPayload): Promise<FileUploadResult> {
    const fullKey = `${payload.bucket}/${payload.key}`;
    this.files.set(fullKey, { buffer: payload.buffer, mimeType: payload.mimeType });

    return {
      bucket: payload.bucket,
      key: payload.key,
      url: `https://storage.jaago.local/${fullKey}`,
      sizeBytes: payload.sizeBytes,
      mimeType: payload.mimeType,
      etag: `etag_${randomBytes(8).toString("hex")}`,
      createdAt: new Date().toISOString(),
    };
  }

  async getSignedUrl(bucket: string, key: string, _expiresInSeconds = 3600): Promise<string> {
    return `https://storage.jaago.local/${bucket}/${key}?token=mock_signed_token_${Date.now()}`;
  }

  async delete(bucket: string, key: string): Promise<{ success: boolean }> {
    const fullKey = `${bucket}/${key}`;
    this.files.delete(fullKey);
    return { success: true };
  }
}
