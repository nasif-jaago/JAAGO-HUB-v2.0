import { describe, it, expect } from "vitest";
import { WebhookSigner } from "../src/webhooks/webhook-signer.js";

describe("WebhookSigner", () => {
  const secret = "webhook_secret_key_123456";
  const signer = new WebhookSigner(secret);
  const payload = JSON.stringify({ event: "payment.approved", id: "pay_123" });

  it("signs and verifies valid webhooks", () => {
    const { signature, timestamp, nonce } = signer.sign(payload);

    const isValid = signer.verify({
      signature,
      timestamp,
      nonce,
      payload,
    });

    expect(isValid).toBe(true);
  });

  it("rejects modified payload with invalid signature", () => {
    const { signature, timestamp, nonce } = signer.sign(payload);

    const isValid = signer.verify({
      signature,
      timestamp,
      nonce,
      payload: JSON.stringify({ event: "payment.rejected" }),
    });

    expect(isValid).toBe(false);
  });

  it("rejects stale webhooks outside tolerance window (replay attack prevention)", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
    const { signature, nonce } = signer.sign(payload, { timestamp: pastTimestamp });

    const isValid = signer.verify({
      signature,
      timestamp: pastTimestamp,
      nonce,
      payload,
      toleranceSeconds: 300,
    });

    expect(isValid).toBe(false);
  });
});
