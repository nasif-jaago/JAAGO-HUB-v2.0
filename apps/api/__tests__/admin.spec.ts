import { describe, it, expect, beforeEach } from "vitest";
import { AdminService } from "../src/modules/admin/admin.service.js";
import { AdminController } from "../src/modules/admin/admin.controller.js";

describe("Admin & RBAC Management Module", () => {
  let adminService: AdminService;
  let adminController: AdminController;
  const mockOrgId = "00000000-1111-2222-3333-444444444444";
  const mockReq = { tenant: { orgId: mockOrgId }, headers: {} };

  beforeEach(() => {
    adminService = new AdminService();
    adminController = new AdminController(adminService);
  });

  describe("RBAC Permissions and Roles", () => {
    it("returns standard system permissions", () => {
      const perms = adminController.getPermissions();
      expect(perms.length).toBeGreaterThan(5);
      expect(perms.some((p) => p.code === "hr.employee.view")).toBe(true);
      expect(perms.some((p) => p.code === "admin.rbac.manage")).toBe(true);
    });

    it("creates, updates and lists custom roles dynamically", () => {
      // 1. List initial roles
      const initialRoles = adminController.getRoles(mockReq);
      expect(initialRoles.length).toBe(4);

      // 2. Create custom role
      const newRole = adminController.createRole(mockReq, {
        name: "Branch Lead",
        code: "branch_lead",
        description: "Branch operations coordinator",
        permissions: ["hr.leave.view", "hr.leave.approve", "procurement.pr.create"],
      });
      expect(newRole.id).toBeDefined();
      expect(newRole.code).toBe("branch_lead");
      expect(newRole.permissions).toHaveLength(3);

      // 3. Update permissions on the role
      const updated = adminController.updateRole(mockReq, newRole.id, {
        permissions: ["hr.leave.view", "hr.leave.approve", "procurement.pr.create", "finance.voucher.view"],
      });
      expect(updated.permissions).toHaveLength(4);

      // 4. Verify reflected in list
      const rolesAfter = adminController.getRoles(mockReq);
      expect(rolesAfter.length).toBe(5);
    });
  });

  describe("Email Server (SMTP) Settings", () => {
    it("gets and updates SMTP configuration with password redaction", () => {
      const config = adminController.getSmtpConfig(mockReq);
      expect(config.host).toBeDefined();

      const updated = adminController.updateSmtpConfig(mockReq, {
        host: "smtp.mailgun.org",
        port: 465,
        secure: true,
        username: "postmaster@jaago.com.bd",
        password: "secret_password_123",
        fromName: "JAAGO Foundation ERP",
        fromEmail: "noreply@jaago.com.bd",
      });

      expect(updated.host).toBe("smtp.mailgun.org");
      expect(updated.port).toBe(465);
      expect(updated.password).toBe("••••••••••••••••");
    });

    it("sends test email using configured SMTP parameters", async () => {
      const testRes = await adminController.sendTestEmail(mockReq, {
        recipientEmail: "officer@jaago.com.bd",
      });
      expect(testRes.success).toBe(true);
      expect(testRes.message).toContain("officer@jaago.com.bd");
    });
  });

  describe("API Tokens & Secret Keys", () => {
    it("generates cryptographic tokens and allows revocation", () => {
      const token = adminController.createApiToken(mockReq, {
        name: "Zapier HR Sync Key",
        scopes: ["hr.employee.view", "hr.leave.view"],
        expiresInDays: 30,
      });

      expect(token.rawSecretToken).toMatch(/^jgo_live_/);
      expect(token.tokenPrefix).toMatch(/^jgo_live_/);
      expect(token.scopes).toContain("hr.employee.view");

      const tokensList = adminController.getApiTokens(mockReq);
      expect(tokensList.some((t) => t.id === token.id)).toBe(true);

      // Revoke
      const revokeRes = adminController.revokeApiToken(mockReq, token.id);
      expect(revokeRes.success).toBe(true);

      const listAfter = adminController.getApiTokens(mockReq);
      expect(listAfter.some((t) => t.id === token.id)).toBe(false);
    });
  });

  describe("Integrations & MCP Management (Step 6.5)", () => {
    it("registers and lists webhooks and MCP servers", () => {
      const webhooks = adminController.getWebhooks();
      expect(webhooks.length).toBeGreaterThanOrEqual(2);

      const newWebhook = adminController.createWebhook({
        name: "QuickBooks Finance Bridge",
        targetUrl: "https://api.quickbooks.com/webhook",
        events: ["voucher.approved"],
      });
      expect(newWebhook.name).toBe("QuickBooks Finance Bridge");
      expect(newWebhook.status).toBe("ACTIVE");

      const mcpServers = adminController.getMcpServers();
      expect(mcpServers.length).toBeGreaterThanOrEqual(2);
      expect(mcpServers.some((s) => s.status === "CONNECTED")).toBe(true);
    });
  });

  describe("Backup & Recovery Center (Step 6.6)", () => {
    it("lists automated snapshots and triggers on-demand database backup", () => {
      const snapshots = adminController.getSnapshots();
      expect(snapshots.length).toBeGreaterThanOrEqual(2);

      const newSnapshot = adminController.triggerSnapshot({
        reason: "Pre-deployment database verification",
      });
      expect(newSnapshot.snapshotRef).toMatch(/^SNAP-\d{4}-/);
      expect(newSnapshot.status).toBe("COMPLETED");
      expect(newSnapshot.checksumSha256).toBeDefined();
    });

    it("executes Point-In-Time-Recovery (PITR) automated drill", () => {
      const pitrResult = adminController.runPitrVerification();
      expect(pitrResult.status).toBe("PASSED");
      expect(pitrResult.integrityChecksumMatched).toBe(true);
      expect(pitrResult.tablesVerified).toBeGreaterThan(20);
    });
  });

  describe("System Telemetry & Health Overview (Step 6.7)", () => {
    it("returns live system telemetry for health dashboard", () => {
      const telemetry = adminController.getSystemTelemetry();
      expect(telemetry.status).toBe("HEALTHY");
      expect(telemetry.database.status).toBe("CONNECTED");
      expect(telemetry.redisCache.status).toBe("CONNECTED");
      expect(telemetry.bullmqQueue.status).toBe("HEALTHY");
      expect(telemetry.cpuUsagePercent).toBeGreaterThan(0);
    });
  });
});

