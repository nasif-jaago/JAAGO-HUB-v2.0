export interface WelcomeEmailData {
  employeeName: string;
  loginUrl: string;
  temporaryPassword?: string | undefined;
  organizationName: string;
}

export interface LeaveDecisionEmailData {
  employeeName: string;
  leaveType: string;
  days: number;
  startDate: string;
  endDate: string;
  status: "APPROVED" | "REJECTED";
  reviewerComment?: string | undefined;
}

export interface ProcurementNotificationData {
  approverName: string;
  requisitionCode: string;
  department: string;
  totalAmountFormatted: string;
  actionUrl: string;
}

export function renderWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const subject = `Welcome to JAAGO HUB — ${data.organizationName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">JAAGO HUB</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 14px;">Enterprise Operations Platform</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${data.employeeName}!</h2>
          <p>Your user profile has been activated on JAAGO HUB for <strong>${data.organizationName}</strong>.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${data.loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Workspace</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">If you have any questions, contact your department administrator.</p>
        </div>
      </body>
    </html>
  `;
  const text = `Welcome ${data.employeeName} to JAAGO HUB (${data.organizationName}). Log in at: ${data.loginUrl}`;
  return { subject, html, text };
}

export function renderLeaveDecisionEmail(data: LeaveDecisionEmailData): { subject: string; html: string; text: string } {
  const isApproved = data.status === "APPROVED";
  const subject = `Leave Request ${data.status} — ${data.leaveType} (${data.days} days)`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${isApproved ? "#059669" : "#dc2626"}; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">Leave Request ${data.status}</h2>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
          <p>Hello <strong>${data.employeeName}</strong>,</p>
          <p>Your leave request for <strong>${data.days} day(s)</strong> of <strong>${data.leaveType}</strong> (${data.startDate} to ${data.endDate}) has been <strong>${data.status}</strong>.</p>
          ${data.reviewerComment ? `<p style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px;"><em>Comment:</em> ${data.reviewerComment}</p>` : ""}
        </div>
      </body>
    </html>
  `;
  const text = `Your leave request for ${data.leaveType} (${data.days} days) has been ${data.status}.`;
  return { subject, html, text };
}
