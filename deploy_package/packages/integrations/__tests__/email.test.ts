import { describe, it, expect } from "vitest";
import { MockEmailProvider } from "../src/email/providers/mock.provider.js";
import { renderWelcomeEmail, renderLeaveDecisionEmail } from "../src/email/templates/email-templates.js";

describe("Email Integration & Template Engine", () => {
  it("renders welcome email template with branding and CTA", () => {
    const rendered = renderWelcomeEmail({
      employeeName: "Nasif Kamal",
      loginUrl: "https://hub.jaago.com.bd/login",
      organizationName: "JAAGO Foundation",
    });

    expect(rendered.subject).toContain("JAAGO HUB — JAAGO Foundation");
    expect(rendered.html).toContain("Welcome, Nasif Kamal!");
    expect(rendered.html).toContain("https://hub.jaago.com.bd/login");
  });

  it("renders leave decision email with dynamic status color", () => {
    const approved = renderLeaveDecisionEmail({
      employeeName: "Salma Khatun",
      leaveType: "Annual Leave",
      days: 4,
      startDate: "2026-09-01",
      endDate: "2026-09-04",
      status: "APPROVED",
    });

    expect(approved.subject).toContain("APPROVED");
    expect(approved.html).toContain("4 day(s)");
  });

  it("dispatches emails via provider abstraction", async () => {
    const provider = new MockEmailProvider();
    const result = await provider.send({
      to: "officer@jaago.com.bd",
      subject: "Test Dispatch",
      html: "<p>Hello World</p>",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("mock");
    expect(provider.sentEmails).toHaveLength(1);
  });
});
