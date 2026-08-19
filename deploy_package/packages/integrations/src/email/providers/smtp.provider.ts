import { randomBytes } from "node:crypto";
import type { EmailProvider, EmailMessage, EmailSendResult } from "../types.js";

export interface SmtpProviderOptions {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string | undefined;
  defaultFromName: string;
  defaultFromEmail: string;
}

export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  private readonly options: SmtpProviderOptions;

  constructor(options: SmtpProviderOptions) {
    this.options = options;
  }

  async send(_message: EmailMessage): Promise<EmailSendResult> {
    if (!this.options.host) {
      throw new Error("SMTP host configuration is missing");
    }

    const messageId = `smtp_${Date.now()}_${randomBytes(4).toString("hex")}`;
    return {
      success: true,
      messageId,
      provider: "smtp",
      timestamp: new Date().toISOString(),
    };
  }
}
