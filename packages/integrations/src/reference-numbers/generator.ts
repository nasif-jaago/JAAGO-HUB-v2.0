export type DocumentType =
  | "PURCHASE_REQUISITION"
  | "PURCHASE_ORDER"
  | "GOODS_RECEIPT"
  | "LEAVE_APPLICATION"
  | "JOURNAL_VOUCHER"
  | "PAYMENT_VOUCHER"
  | "RECEIPT_VOUCHER"
  | "ASSET_TAG"
  | "RECRUITMENT_REQUISITION";

export interface GenerateReferenceOptions {
  documentType: DocumentType;
  sequence: number;
  date?: Date | undefined;
  branchCode?: string | undefined;
}

const DOCUMENT_PREFIXES: Record<DocumentType, string> = {
  PURCHASE_REQUISITION: "PR",
  PURCHASE_ORDER: "PO",
  GOODS_RECEIPT: "GRN",
  LEAVE_APPLICATION: "LV",
  JOURNAL_VOUCHER: "JV",
  PAYMENT_VOUCHER: "PV",
  RECEIPT_VOUCHER: "RV",
  ASSET_TAG: "AST",
  RECRUITMENT_REQUISITION: "REC",
};

/**
 * Generate formatted enterprise reference number.
 * e.g.:
 * - PR-2026-08-0042
 * - JV-2026-08-0105
 * - AST-DHK-2026-0012
 */
export function generateReferenceNumber(options: GenerateReferenceOptions): string {
  const prefix = DOCUMENT_PREFIXES[options.documentType] || "DOC";
  const targetDate = options.date || new Date();
  const year = targetDate.getFullYear().toString();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
  const seqPadded = options.sequence.toString().padStart(4, "0");

  if (options.documentType === "ASSET_TAG" && options.branchCode) {
    return `${prefix}-${options.branchCode.toUpperCase()}-${year}-${seqPadded}`;
  }

  return `${prefix}-${year}-${month}-${seqPadded}`;
}
