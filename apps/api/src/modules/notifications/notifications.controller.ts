import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Req,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { NotificationsService } from "./notifications.service.js";
import type { NotificationDto, CreateNotificationDto } from "./dto/notification.dto.js";

@ApiTags("Notification Center")
@ApiBearerAuth()
@Controller("api/v1/notifications")
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifService: NotificationsService) {}

  private resolveContext(req: { user?: { id: string }; tenant?: { orgId?: string }; headers?: Record<string, string> }) {
    const userId = req.user?.id || "00000000-0000-0000-0000-000000000001";
    const orgId = req.tenant?.orgId || (req.headers?.["x-org-id"] as string) || "00000000-0000-0000-0000-000000000000";
    return { userId, orgId };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get current user notifications and unread badge count" })
  getNotifications(
    @Req() req: { user?: { id: string }; tenant?: { orgId?: string }; headers?: Record<string, string> },
  ): { items: NotificationDto[]; unreadCount: number } {
    const { userId, orgId } = this.resolveContext(req);
    return this.notifService.getNotifications(userId, orgId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: "Publish a new notification" })
  createNotification(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateNotificationDto,
  ): NotificationDto {
    const orgId = req.tenant?.orgId || (req.headers?.["x-org-id"] as string) || "00000000-0000-0000-0000-000000000000";
    return this.notifService.createNotification(orgId, dto);
  }

  @Public()
  @Put(":id/read")
  @ApiOperation({ summary: "Mark a specific notification as read" })
  markAsRead(
    @Param("id") id: string,
    @Req() req: { user?: { id: string } },
  ): NotificationDto {
    const userId = req.user?.id || "00000000-0000-0000-0000-000000000001";
    return this.notifService.markAsRead(userId, id);
  }

  @Public()
  @Put("read-all")
  @ApiOperation({ summary: "Mark all user notifications as read" })
  markAllAsRead(
    @Req() req: { user?: { id: string }; tenant?: { orgId?: string }; headers?: Record<string, string> },
  ): { success: boolean; updatedCount: number } {
    const { userId, orgId } = this.resolveContext(req);
    return this.notifService.markAllAsRead(userId, orgId);
  }
}
