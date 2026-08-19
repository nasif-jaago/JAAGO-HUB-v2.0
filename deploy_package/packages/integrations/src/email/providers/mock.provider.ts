import { randomBytes } from "node:crypto";
import type { EmailProvider, EmailMessage, EmailSendResult } from "../types.js";

export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";
  readonly sentEmails: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.sentEmails.push(message);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${randomBytes(4).toString("hex")}`,
      provider: "mock",
      timestamp: new Date().toISOString(),
    };
  }

  clear(): void {
    this.sentEmails.length = 0;
  }
}
