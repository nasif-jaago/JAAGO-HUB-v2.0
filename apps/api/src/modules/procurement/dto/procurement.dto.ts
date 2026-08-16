export type PRStatus = "DRAFT" | "PENDING_APPROVAL" | "QUOTING" | "CS_READY" | "PO_ISSUED" | "DELIVERED" | "REJECTED";
export type POStatus = "ISSUED" | "ACKNOWLEDGED" | "PARTIAL_RECEIVED" | "COMPLETED" | "CANCELLED";

export interface PRItemDto {
  id: string;
  itemDescription: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalEstimatedPrice: number;
}

export interface VendorQuoteDto {
  id: string;
  vendorId: string;
  vendorName: string;
  quotedAmount: number;
  deliveryLeadDays: number;
  warrantyPeriod: string;
  validUntil: string;
  isLowestBidder?: boolean | undefined;
  isRecommended?: boolean | undefined;
  remarks?: string | undefined;
  submittedAt: string;
}

export interface PurchaseRequisitionDto {
  id: string;
  orgId: string;
  referenceNumber: string; // e.g. PR-2026-08-0042
  title: string;
  departmentName: string;
  officeLocation: string;
  requesterId: string;
  requesterName: string;
  estimatedTotalAmount: number;
  currency: string;
  justification: string;
  status: PRStatus;
  items: PRItemDto[];
  quotes: VendorQuoteDto[];
  awardedVendorId?: string | undefined;
  awardedVendorName?: string | undefined;
  associatedPoNumber?: string | undefined;
  createdAt: string;
}

export interface CreatePRDto {
  title: string;
  departmentName: string;
  officeLocation: string;
  justification: string;
  currency?: string | undefined;
  items: Array<{
    itemDescription: string;
    category: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice: number;
  }>;
}

export interface SubmitVendorQuoteDto {
  vendorName: string;
  quotedAmount: number;
  deliveryLeadDays: number;
  warrantyPeriod: string;
  validUntil: string;
  remarks?: string | undefined;
}

export interface PurchaseOrderDto {
  id: string;
  orgId: string;
  poNumber: string; // e.g. PO-2026-08-0012
  prId: string;
  prReference: string;
  vendorId: string;
  vendorName: string;
  orderTotalAmount: number;
  currency: string;
  paymentTerms: string;
  deliveryLocation: string;
  deliveryDeadline: string;
  status: POStatus;
  issuedAt: string;
}

export interface IssuePODto {
  vendorName: string;
  orderTotalAmount: number;
  paymentTerms?: string | undefined;
  deliveryLocation: string;
  deliveryDeadline: string;
}
