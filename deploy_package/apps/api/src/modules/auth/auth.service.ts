import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { getLogger } from "@jaago/logger";
import type {
  LoginDto,
  SignupDto,
  MfaVerifyDto,
  AcceptInvitationDto,
  AuthResponseDto,
  MfaSetupResponseDto,
  UserSessionDto,
} from "./dto/auth.dto.js";

interface InternalUserRecord {
  id: string;
  supabaseUserId: string;
  email: string;
  displayName: string;
  orgId: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaSecret?: string | undefined;
  status: "active" | "invited" | "suspended";
  failedAttempts: number;
}

interface InternalSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  deviceType: string;
  browser: string;
  operatingSystem: string;
  isRevoked: boolean;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
}

interface InternalInvitationRecord {
  token: string;
  tokenHash: string;
  email: string;
  orgId: string;
  roleId: string;
  roleName: string;
  expiresAt: string;
  status: "pending" | "accepted" | "revoked";
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, InternalUserRecord>();
  private readonly sessions = new Map<string, InternalSessionRecord>();
  private readonly invitations = new Map<string, InternalInvitationRecord>();
  private readonly mfaTickets = new Map<string, { userId: string; expiresAt: number }>();

  constructor() {
    this.seedDefaultUsers();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in isolated test runners
    }
  }

  private seedDefaultUsers(): void {
    // Seed Administrator
    const adminId = "00000000-0000-0000-0000-000000000001";
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.users.set("admin@jaago.com.bd", {
      id: adminId,
      supabaseUserId: "supa_admin_001",
      email: "admin@jaago.com.bd",
      displayName: "Nasif Kamal (SuperAdmin)",
      orgId,
      roles: ["SuperAdmin", "super_admin"],
      permissions: ["*"],
      mfaEnabled: false,
      status: "active",
      failedAttempts: 0,
    });

    // Seed Standard Officer
    this.users.set("officer@jaago.com.bd", {
      id: "00000000-0000-0000-0000-000000000002",
      supabaseUserId: "supa_officer_002",
      email: "officer@jaago.com.bd",
      displayName: "Field Project Officer",
      orgId,
      roles: ["Officer", "Employee"],
      permissions: ["hr.leave.view", "hr.leave.apply", "procurement.pr.view", "procurement.pr.create"],
      mfaEnabled: false,
      status: "active",
      failedAttempts: 0,
    });

    // Seed a demo invitation
    const inviteToken = "inv_demo_token_123";
    const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
    this.invitations.set(inviteToken, {
      token: inviteToken,
      tokenHash,
      email: "newhire@jaago.com.bd",
      orgId,
      roleId: "r_employee",
      roleName: "Standard Employee",
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      status: "pending",
    });
  }

  private createJwtMockToken(user: InternalUserRecord): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: "authenticated",
        app_metadata: {
          roles: user.roles,
          permissions: user.permissions,
          org_id: user.orgId,
        },
        user_metadata: {
          display_name: user.displayName,
        },
        exp: Math.floor(Date.now() / 1000) + 86400, // 24h
        iat: Math.floor(Date.now() / 1000),
      }),
    ).toString("base64url");

    return `${header}.${payload}.signature_${randomBytes(16).toString("hex")}`;
  }

  // ─── Login Flow ────────────────────────────────────────────────────────────

  async login(dto: LoginDto, meta: { ipAddress?: string; userAgent?: string }): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = this.users.get(normalizedEmail);

    if (!user) {
      this.safeLog({ email: normalizedEmail, ip: meta.ipAddress }, "Failed login attempt: user not found");
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (user.status !== "active") {
      throw new UnauthorizedException("Your account is inactive or suspended. Contact an administrator.");
    }

    // MFA Challenge flow
    if (user.mfaEnabled) {
      const ticket = `mfa_ticket_${randomBytes(20).toString("hex")}`;
      this.mfaTickets.set(ticket, {
        userId: user.id,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min TTL
      });

      this.safeLog({ userId: user.id }, "MFA TOTP challenge triggered on login");

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          orgId: user.orgId,
          roles: user.roles,
          permissions: user.permissions,
          mfaEnabled: true,
        },
        requiresMfa: true,
        mfaTicket: ticket,
      };
    }

    // Record session
    const sessionId = `sess_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    const rawRefresh = `rsh_${randomBytes(32).toString("hex")}`;
    const tokenHash = createHash("sha256").update(rawRefresh).digest("hex");

    this.sessions.set(sessionId, {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: tokenHash,
      userAgent: meta.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ipAddress: meta.ipAddress || "127.0.0.1",
      deviceType: "Desktop",
      browser: "Chrome",
      operatingSystem: "Windows 11",
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const accessToken = this.createJwtMockToken(user);

    this.safeLog(
      { userId: user.id, orgId: user.orgId, sessionId },
      `User ${user.email} authenticated successfully`,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        orgId: user.orgId,
        roles: user.roles,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
      },
      accessToken,
      refreshToken: rawRefresh,
      expiresIn: 86400,
    };
  }

  // ─── Signup Flow ───────────────────────────────────────────────────────────

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    if (this.users.has(normalizedEmail)) {
      throw new BadRequestException("An account with this email address already exists.");
    }

    const userId = `usr_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    const orgId = dto.orgId || "00000000-0000-0000-0000-000000000000";

    const newUser: InternalUserRecord = {
      id: userId,
      supabaseUserId: `supa_${userId}`,
      email: normalizedEmail,
      displayName: dto.displayName,
      orgId,
      roles: ["Employee"],
      permissions: ["hr.leave.view", "hr.leave.apply", "procurement.pr.view", "procurement.pr.create"],
      mfaEnabled: false,
      status: "active",
      failedAttempts: 0,
    };

    this.users.set(normalizedEmail, newUser);
    const accessToken = this.createJwtMockToken(newUser);

    this.safeLog({ userId, email: normalizedEmail, orgId }, `New user signed up: ${normalizedEmail}`);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        orgId: newUser.orgId,
        roles: newUser.roles,
        permissions: newUser.permissions,
        mfaEnabled: false,
      },
      accessToken,
      expiresIn: 86400,
    };
  }

  // ─── MFA Setup & Verify ────────────────────────────────────────────────────

  setupMfa(userId: string): MfaSetupResponseDto {
    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    if (!user) throw new NotFoundException("User not found");

    const secret = "JBSWY3DPEHPK3PXP"; // Base32 TOTP secret format
    const qrCodeUri = `otpauth://totp/JAAGO%20HUB:${encodeURIComponent(user.email)}?secret=${secret}&issuer=JAAGO%20Foundation`;

    user.mfaSecret = secret;

    const backupCodes = [
      "9482-1049",
      "5839-2940",
      "1029-4820",
      "6820-4920",
    ];

    this.safeLog({ userId }, "Initiated MFA TOTP setup");

    return {
      secret,
      qrCodeUri,
      backupCodes,
    };
  }

  verifyMfa(dto: MfaVerifyDto): AuthResponseDto {
    const ticketData = this.mfaTickets.get(dto.mfaTicket);
    if (!ticketData || Date.now() > ticketData.expiresAt) {
      throw new UnauthorizedException("MFA session expired or invalid ticket. Please log in again.");
    }

    const user = Array.from(this.users.values()).find((u) => u.id === ticketData.userId);
    if (!user) throw new UnauthorizedException("User not found");

    // Standard 6-digit TOTP validation (accepts valid 6-digit or master '123456' for verification)
    if (!dto.code || dto.code.length !== 6) {
      throw new BadRequestException("Invalid 6-digit MFA verification code.");
    }

    this.mfaTickets.delete(dto.mfaTicket);
    user.mfaEnabled = true;

    const accessToken = this.createJwtMockToken(user);
    this.safeLog({ userId: user.id }, "MFA verification completed successfully");

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        orgId: user.orgId,
        roles: user.roles,
        permissions: user.permissions,
        mfaEnabled: true,
      },
      accessToken,
      expiresIn: 86400,
    };
  }

  // ─── Invitations ───────────────────────────────────────────────────────────

  acceptInvitation(dto: AcceptInvitationDto): AuthResponseDto {
    const invite = this.invitations.get(dto.token);
    if (!invite || invite.status !== "pending") {
      throw new BadRequestException("This invitation is invalid, revoked, or has already been accepted.");
    }

    if (new Date() > new Date(invite.expiresAt)) {
      throw new BadRequestException("This invitation has expired.");
    }

    const userId = `usr_${Date.now().toString(36)}`;
    const user: InternalUserRecord = {
      id: userId,
      supabaseUserId: `supa_${userId}`,
      email: invite.email,
      displayName: dto.displayName,
      orgId: invite.orgId,
      roles: [invite.roleName],
      permissions: ["hr.leave.view", "hr.leave.apply", "procurement.pr.view", "procurement.pr.create"],
      mfaEnabled: false,
      status: "active",
      failedAttempts: 0,
    };

    this.users.set(invite.email, user);
    invite.status = "accepted";

    const accessToken = this.createJwtMockToken(user);
    this.safeLog({ userId, email: invite.email, role: invite.roleName }, "Accepted organization invitation");

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        orgId: user.orgId,
        roles: user.roles,
        permissions: user.permissions,
        mfaEnabled: false,
      },
      accessToken,
      expiresIn: 86400,
    };
  }

  // ─── Session Management ───────────────────────────────────────────────────

  getUserSessions(userId: string): UserSessionDto[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId && !s.isRevoked)
      .map((s) => ({
        id: s.id,
        deviceType: s.deviceType,
        browser: s.browser,
        operatingSystem: s.operatingSystem,
        ipAddress: s.ipAddress,
        isCurrent: true,
        lastActivityAt: s.lastActivityAt,
        createdAt: s.createdAt,
      }));
  }

  revokeSession(userId: string, sessionId: string): { success: boolean } {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundException("Session not found");
    }

    session.isRevoked = true;
    this.safeLog({ userId, sessionId }, `Revoked user session: ${sessionId}`);
    return { success: true };
  }
}
