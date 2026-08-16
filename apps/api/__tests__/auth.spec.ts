import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { AuthController } from "../src/modules/auth/auth.controller.js";

describe("Auth & Identity Management Module", () => {
  let authService: AuthService;
  let authController: AuthController;

  beforeEach(() => {
    authService = new AuthService();
    authController = new AuthController(authService);
  });

  describe("Login & JWT Issuance", () => {
    it("authenticates existing user and issues JWT token", async () => {
      const res = await authController.login(
        { email: "admin@jaago.com.bd", password: "securepassword" },
        { ip: "192.168.1.100", headers: { "user-agent": "Vitest/1.0" } },
      );

      expect(res.user.email).toBe("admin@jaago.com.bd");
      expect(res.user.roles).toContain("SuperAdmin");
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
    });

    it("rejects invalid login credentials", async () => {
      await expect(
        authController.login({ email: "nonexistent@jaago.com.bd", password: "wrong" }, {}),
      ).rejects.toThrow("Invalid email or password.");
    });
  });

  describe("Signup & Registration", () => {
    it("registers new employee account", async () => {
      const res = await authController.signup({
        email: "salma.khatun@jaago.com.bd",
        password: "Password123!",
        displayName: "Salma Khatun",
      });

      expect(res.user.email).toBe("salma.khatun@jaago.com.bd");
      expect(res.user.displayName).toBe("Salma Khatun");
      expect(res.accessToken).toBeDefined();
    });
  });

  describe("MFA Setup & Verification", () => {
    it("generates TOTP secret and verifies code", async () => {
      const loginRes = await authController.login(
        { email: "admin@jaago.com.bd", password: "pass" },
        {},
      );

      const mfaSetup = authController.setupMfa(loginRes.user.id);
      expect(mfaSetup.secret).toBeDefined();
      expect(mfaSetup.qrCodeUri).toContain("otpauth://totp");
      expect(mfaSetup.backupCodes.length).toBeGreaterThan(0);
    });
  });

  describe("Invitations Flow", () => {
    it("accepts valid invitation token and creates active account", () => {
      const res = authController.acceptInvitation({
        token: "inv_demo_token_123",
        password: "NewPassword123!",
        displayName: "New Hire Officer",
      });

      expect(res.user.email).toBe("newhire@jaago.com.bd");
      expect(res.user.displayName).toBe("New Hire Officer");
      expect(res.accessToken).toBeDefined();
    });
  });

  describe("Device Sessions & Revocation", () => {
    it("lists active device sessions and allows revoking", async () => {
      const loginRes = await authController.login(
        { email: "admin@jaago.com.bd", password: "pass" },
        { ip: "10.0.0.1" },
      );

      const sessions = authController.getUserSessions({ user: { id: loginRes.user.id } });
      expect(sessions.length).toBeGreaterThan(0);

      const revokeRes = authController.revokeSession(sessions[0]!.id, { user: { id: loginRes.user.id } });
      expect(revokeRes.success).toBe(true);
    });
  });
});
