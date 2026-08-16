export interface NotificationDto {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "action_required";
  actionUrl?: string | undefined;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "action_required" | undefined;
  actionUrl?: string | undefined;
}
