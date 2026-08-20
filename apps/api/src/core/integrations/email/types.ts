export interface EmailRecipient {
  email: string;
  name?: string | undefined;
}

export interface EmailMessage {
  to: string | EmailRecipient | (string | EmailRecipient)[];
  subject: string;
  html: string;
  text?: string | undefined;
  from?: string | EmailRecipient | undefined;
  replyTo?: string | undefined;
  tags?: string[] | undefined;
  templateId?: string | undefined;
  templateData?: Record<string, unknown> | undefined;
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  provider: "smtp" | "sendgrid" | "mailgun" | "mock";
  timestamp: string;
}

export interface EmailProvider {
  readonly name: "smtp" | "sendgrid" | "mailgun" | "mock";
  send(message: EmailMessage): Promise<EmailSendResult>;
}
