import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { getLogger } from "@jaago/logger";
import type { NotificationDto, CreateNotificationDto } from "./dto/notification.dto.js";

@Injectable()
export class NotificationsService {
  private readonly notifications: NotificationDto[] = [];

  constructor() {
    this.seedDefaultNotifications();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultNotifications(): void {
    const adminId = "00000000-0000-0000-0000-000000000001";
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.notifications.push(
      {
        id: "notif_1",
        userId: adminId,
        orgId,
        title: "Leave Request Pending Approval",
        message: "Salma Khatun has applied for 4 days Annual Leave.",
        type: "action_required",
        actionUrl: "/approvals",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      },
      {
        id: "notif_2",
        userId: adminId,
        orgId,
        title: "Purchase Requisition Created",
        message: "PR-2026-0042 for Classroom Supplies requires tier-1 budget review.",
        type: "info",
        actionUrl: "/procurement",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: "notif_3",
        userId: adminId,
        orgId,
        title: "Security Policy Notice",
        message: "Two-factor authentication requirement has been activated for administrative accounts.",
        type: "warning",
        actionUrl: "/admin/settings",
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
    );
  }

  getNotifications(userId: string, orgId: string): { items: NotificationDto[]; unreadCount: number } {
    const items = this.notifications
      .filter((n) => (n.userId === userId || n.userId === "all") && n.orgId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = items.filter((n) => !n.isRead).length;

    return { items, unreadCount };
  }

  createNotification(orgId: string, dto: CreateNotificationDto): NotificationDto {
    const id = `notif_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
    const notification: NotificationDto = {
      id,
      userId: dto.userId,
      orgId,
      title: dto.title,
      message: dto.message,
      type: dto.type || "info",
      actionUrl: dto.actionUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notification);
    this.safeLog({ orgId, notifId: id, recipient: dto.userId }, `Created in-app notification: ${dto.title}`);
    return notification;
  }

  markAsRead(userId: string, notifId: string): NotificationDto {
    const notif = this.notifications.find((n) => n.id === notifId && (n.userId === userId || n.userId === "all"));
    if (!notif) {
      throw new NotFoundException(`Notification ${notifId} not found`);
    }

    notif.isRead = true;
    return notif;
  }

  markAllAsRead(userId: string, orgId: string): { success: boolean; updatedCount: number } {
    let count = 0;
    for (const notif of this.notifications) {
      if ((notif.userId === userId || notif.userId === "all") && notif.orgId === orgId && !notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }
    return { success: true, updatedCount: count };
  }
}
