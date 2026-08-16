import { describe, it, expect, beforeEach } from "vitest";
import { NotificationsService } from "../src/modules/notifications/notifications.service.js";
import { NotificationsController } from "../src/modules/notifications/notifications.controller.js";

describe("Notification Center Module", () => {
  let notifService: NotificationsService;
  let notifController: NotificationsController;
  const mockUserId = "00000000-0000-0000-0000-000000000001";
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = { user: { id: mockUserId }, tenant: { orgId: mockOrgId }, headers: {} };

  beforeEach(() => {
    notifService = new NotificationsService();
    notifController = new NotificationsController(notifService);
  });

  it("fetches user notifications and computes unread badge count", () => {
    const res = notifController.getNotifications(mockReq);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.unreadCount).toBeGreaterThan(0);
  });

  it("creates a new in-app notification", () => {
    const created = notifController.createNotification(mockReq, {
      userId: mockUserId,
      title: "Budget Allocated",
      message: "Q3 Education fund has been disbursed.",
      type: "success",
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe("Budget Allocated");

    const list = notifController.getNotifications(mockReq);
    expect(list.items.some((n) => n.id === created.id)).toBe(true);
  });

  it("marks individual notification as read", () => {
    const list = notifController.getNotifications(mockReq);
    const unread = list.items.find((n) => !n.isRead);
    expect(unread).toBeDefined();

    const read = notifController.markAsRead(unread!.id, mockReq);
    expect(read.isRead).toBe(true);
  });

  it("marks all notifications as read", () => {
    const res = notifController.markAllAsRead(mockReq);
    expect(res.success).toBe(true);

    const listAfter = notifController.getNotifications(mockReq);
    expect(listAfter.unreadCount).toBe(0);
  });
});
