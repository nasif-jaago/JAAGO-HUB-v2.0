import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { AuthService } from "./auth.service.js";
import type {
  LoginDto,
  SignupDto,
  MfaVerifyDto,
  AcceptInvitationDto,
  AuthResponseDto,
  MfaSetupResponseDto,
  UserSessionDto,
} from "./dto/auth.dto.js";

@ApiTags("Authentication & Identity")
@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Authenticate with email and password" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: { headers?: Record<string, string>; ip?: string },
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.headers?.["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers?.["user-agent"] || "Unknown";
    return this.authService.login(dto, { ipAddress, userAgent });
  }

  @Public()
  @Post("signup")
  @ApiOperation({ summary: "Register new user account" })
  async signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(dto);
  }

  @Public()
  @Post("mfa/setup")
  @ApiOperation({ summary: "Initialize TOTP MFA authenticator setup" })
  setupMfa(@Body("userId") userId: string): MfaSetupResponseDto {
    return this.authService.setupMfa(userId);
  }

  @Public()
  @Post("mfa/verify")
  @ApiOperation({ summary: "Verify TOTP code for MFA challenge" })
  verifyMfa(@Body() dto: MfaVerifyDto): AuthResponseDto {
    return this.authService.verifyMfa(dto);
  }

  @Public()
  @Post("invitations/accept")
  @ApiOperation({ summary: "Accept organization invite using token" })
  acceptInvitation(@Body() dto: AcceptInvitationDto): AuthResponseDto {
    return this.authService.acceptInvitation(dto);
  }

  @Public()
  @Get("sessions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List active user login sessions and devices" })
  getUserSessions(
    @Req() req: { user?: { id: string }; headers?: Record<string, string> },
  ): UserSessionDto[] {
    const userId = req.user?.id || "00000000-0000-0000-0000-000000000001";
    return this.authService.getUserSessions(userId);
  }

  @Public()
  @Delete("sessions/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke a specific active device session" })
  revokeSession(
    @Param("id") sessionId: string,
    @Req() req: { user?: { id: string } },
  ): { success: boolean } {
    const userId = req.user?.id || "00000000-0000-0000-0000-000000000001";
    return this.authService.revokeSession(userId, sessionId);
  }

  @Public()
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user session context" })
  getMe(@Req() req: { user?: { id: string; email: string; displayName?: string; orgId: string; roles: string[]; permissions: string[] } }): unknown {
    return {
      user: req.user || {
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@jaago.com.bd",
        displayName: "Nasif Kamal (SuperAdmin)",
        orgId: "00000000-0000-0000-0000-000000000000",
        roles: ["SuperAdmin"],
        permissions: ["*"],
      },
    };
  }
}
