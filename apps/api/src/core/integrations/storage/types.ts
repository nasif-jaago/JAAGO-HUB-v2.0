export interface FileUploadPayload {
  bucket: string;
  key: string;
  buffer: Buffer | Uint8Array;
  mimeType: string;
  sizeBytes: number;
  metadata?: Record<string, string> | undefined;
}

export interface FileUploadResult {
  bucket: string;
  key: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  etag?: string | undefined;
  createdAt: string;
}

export interface StorageProvider {
  readonly name: "supabase" | "s3" | "mock";
  upload(payload: FileUploadPayload): Promise<FileUploadResult>;
  getSignedUrl(bucket: string, key: string, expiresInSeconds?: number): Promise<string>;
  delete(bucket: string, key: string): Promise<{ success: boolean }>;
}
