import crypto from "node:crypto";

export interface EncryptedPayload {
  encryptedData: string; // Base64
  encryptedDek: string;  // Base64
  iv: string;            // Base64 (12 bytes)
  dekIv: string;         // Base64 (12 bytes)
  authTag: string;       // Base64 (16 bytes)
  dekAuthTag: string;    // Base64 (16 bytes)
}

export class EnvelopeEncryption {
  private readonly kek: Buffer;

  constructor(kekString: string) {
    if (!kekString || kekString.length < 32) {
      throw new Error("Envelope encryption KEK must be at least 32 characters long");
    }
    // Derive exactly 32 bytes for AES-256 using SHA-256
    this.kek = crypto.createHash("sha256").update(kekString).digest();
  }

  /**
   * Encrypt plaintext data using envelope encryption (AES-256-GCM).
   */
  encrypt(plaintext: string | Buffer): EncryptedPayload {
    const buffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, "utf8");

    // 1. Generate random 256-bit DEK
    const dek = crypto.randomBytes(32);

    // 2. Encrypt plaintext with DEK
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
    const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 3. Encrypt DEK with KEK
    const dekIv = crypto.randomBytes(12);
    const dekCipher = crypto.createCipheriv("aes-256-gcm", this.kek, dekIv);
    const encryptedDek = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
    const dekAuthTag = dekCipher.getAuthTag();

    return {
      encryptedData: encryptedData.toString("base64"),
      encryptedDek: encryptedDek.toString("base64"),
      iv: iv.toString("base64"),
      dekIv: dekIv.toString("base64"),
      authTag: authTag.toString("base64"),
      dekAuthTag: dekAuthTag.toString("base64"),
    };
  }

  /**
   * Decrypt envelope-encrypted payload.
   */
  decrypt(payload: EncryptedPayload): string {
    const encryptedDek = Buffer.from(payload.encryptedDek, "base64");
    const dekIv = Buffer.from(payload.dekIv, "base64");
    const dekAuthTag = Buffer.from(payload.dekAuthTag, "base64");

    // 1. Decrypt DEK using KEK
    const dekDecipher = crypto.createDecipheriv("aes-256-gcm", this.kek, dekIv);
    dekDecipher.setAuthTag(dekAuthTag);
    const dek = Buffer.concat([dekDecipher.update(encryptedDek), dekDecipher.final()]);

    // 2. Decrypt data using decrypted DEK
    const encryptedData = Buffer.from(payload.encryptedData, "base64");
    const iv = Buffer.from(payload.iv, "base64");
    const authTag = Buffer.from(payload.authTag, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", dek, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    return decrypted.toString("utf8");
  }
}
