import crypto from "node:crypto";

export interface WebhookSignOptions {
  timestamp?: number;
  nonce?: string;
}

export interface WebhookVerifyOptions {
  signature: string;
  timestamp: number;
  nonce: string;
  payload: string | Buffer;
  toleranceSeconds?: number;
}

export class WebhookSigner {
  private readonly secret: string;

  constructor(secret: string) {
    if (!secret || secret.length < 16) {
      throw new Error("Webhook secret must be at least 16 characters");
    }
    this.secret = secret;
  }

  /**
   * Generate an HMAC signature and metadata for an outgoing webhook payload.
   */
  sign(payload: string | Buffer, options: WebhookSignOptions = {}): {
    signature: string;
    timestamp: number;
    nonce: string;
  } {
    const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
    const nonce = options.nonce ?? crypto.randomBytes(12).toString("hex");
    const bodyString = typeof payload === "string" ? payload : payload.toString("utf8");

    const message = `${timestamp}.${nonce}.${bodyString}`;
    const signature = crypto.createHmac("sha256", this.secret).update(message).digest("hex");

    return {
      signature,
      timestamp,
      nonce,
    };
  }

  /**
   * Verify an incoming webhook signature with timestamp tolerance and constant-time check.
   */
  verify(options: WebhookVerifyOptions): boolean {
    const { signature, timestamp, nonce, payload, toleranceSeconds = 300 } = options;
    const now = Math.floor(Date.now() / 1000);

    // 1. Check timestamp tolerance (prevent replay attack)
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    // 2. Compute expected signature
    const bodyString = typeof payload === "string" ? payload : payload.toString("utf8");
    const message = `${timestamp}.${nonce}.${bodyString}`;
    const expectedSignature = crypto.createHmac("sha256", this.secret).update(message).digest("hex");

    // 3. Constant-time comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
