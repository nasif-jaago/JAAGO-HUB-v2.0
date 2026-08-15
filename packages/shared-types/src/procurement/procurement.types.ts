import type { PurchaseRequestStatus, PurchaseOrderStatus } from "../enums/index.js";
import type { Money } from "../common/index.js";

export interface PurchaseRequest {
  id: string;
  orgId: string;
  referenceNumber: string;
  departmentId: string;
  requestedBy: string;
  costCenterId: string | null;
  purpose: string;
  requiredBy: string | null;
  status: PurchaseRequestStatus;
  approvalRequestId: string | null;
  totalEstimatedAmount: Money | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestLineItem {
  id: string;
  purchaseRequestId: string;
  description: string;
  quantity: string;
  unit: string | null;
  estimatedUnitCost: Money | null;
  estimatedTotal: Money | null;
}

export interface PurchaseOrder {
  id: string;
  orgId: string;
  referenceNumber: string;
  purchaseRequestId: string | null;
  vendorId: string;
  status: PurchaseOrderStatus;
  totalAmount: Money;
  approvalRequestId: string | null;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  orgId: string;
  vendorCode: string;
  name: string;
  categoryId: string | null;
  status: string;
  contactEmail: string | null;
  contactPhone: string | null;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
}
