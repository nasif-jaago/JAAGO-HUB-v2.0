import { describe, it, expect } from "vitest";
import { EnvelopeEncryption } from "../src/encryption/envelope-encryption.js";

describe("EnvelopeEncryption", () => {
  const kek = "super_secret_kek_key_for_testing_purposes_only_32_chars";
  const encryptor = new EnvelopeEncryption(kek);

  it("encrypts and decrypts string payloads correctly", () => {
    const sensitiveData = "User bank account details: IBAN1234567890";
    const encrypted = encryptor.encrypt(sensitiveData);

    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.encryptedDek).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.dekIv).toBeDefined();
    expect(encrypted.encryptedData).not.toBe(sensitiveData);

    const decrypted = encryptor.decrypt(encrypted);
    expect(decrypted).toBe(sensitiveData);
  });

  it("generates different ciphertext for identical inputs (fresh DEK per call)", () => {
    const data = "Sensitive confidential text";
    const enc1 = encryptor.encrypt(data);
    const enc2 = encryptor.encrypt(data);

    expect(enc1.encryptedData).not.toBe(enc2.encryptedData);
    expect(enc1.encryptedDek).not.toBe(enc2.encryptedDek);

    expect(encryptor.decrypt(enc1)).toBe(data);
    expect(encryptor.decrypt(enc2)).toBe(data);
  });

  it("fails decryption if authTag is tampered with", () => {
    const encrypted = encryptor.encrypt("Secret message");
    const tampered = { ...encrypted, authTag: Buffer.alloc(16).toString("base64") };

    expect(() => encryptor.decrypt(tampered)).toThrow();
  });
});
