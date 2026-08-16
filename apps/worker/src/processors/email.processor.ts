import type { Job } from "bullmq";
import { getLogger } from "@jaago/logger";
import type { BaseJobPayload } from "@jaago/queue";
import {
  MockEmailProvider,
  renderWelcomeEmail,
  renderLeaveDecisionEmail,
} from "@jaago/integrations";

export interface SendEmailJobData extends BaseJobPayload {
  to: string;
  subject?: string | undefined;
  templateId: "welcome_employee" | "leave_decision" | "raw";
  html?: string | undefined;
  templateVariables?: Record<string, unknown> | undefined;
}

const mockProvider = new MockEmailProvider();

export async function processEmailJob(job: Job<SendEmailJobData>): Promise<{ success: boolean; messageId: string }> {
  const logger = getLogger();
  const { to, subject: customSubject, templateId, templateVariables, correlationId, orgId, userId } = job.data;

  let renderedSubject = customSubject || "JAAGO HUB Notification";
  let renderedHtml = job.data.html || "<p>Notification from JAAGO HUB</p>";

  if (templateId === "welcome_employee") {
    const rendered = renderWelcomeEmail({
      employeeName: (templateVariables?.["employeeName"] as string) || "Team Member",
      loginUrl: (templateVariables?.["loginUrl"] as string) || "https://hub.jaago.com.bd/login",
      organizationName: (templateVariables?.["organizationName"] as string) || "JAAGO Foundation",
    });
    renderedSubject = rendered.subject;
    renderedHtml = rendered.html;
  } else if (templateId === "leave_decision") {
    const rendered = renderLeaveDecisionEmail({
      employeeName: (templateVariables?.["employeeName"] as string) || "Employee",
      leaveType: (templateVariables?.["leaveType"] as string) || "Annual Leave",
      days: Number(templateVariables?.["days"] || 1),
      startDate: (templateVariables?.["startDate"] as string) || "2026-08-16",
      endDate: (templateVariables?.["endDate"] as string) || "2026-08-17",
      status: (templateVariables?.["status"] as "APPROVED" | "REJECTED") || "APPROVED",
      reviewerComment: templateVariables?.["reviewerComment"] as string | undefined,
    });
    renderedSubject = rendered.subject;
    renderedHtml = rendered.html;
  }

  const result = await mockProvider.send({
    to,
    subject: renderedSubject,
    html: renderedHtml,
  });

  logger.info(
    {
      jobId: job.id,
      messageId: result.messageId,
      to,
      subject: renderedSubject,
      correlationId,
      orgId,
      userId,
      provider: result.provider,
    },
    `Email successfully delivered to ${to} via ${result.provider}`,
  );

  return { success: true, messageId: result.messageId };
}
