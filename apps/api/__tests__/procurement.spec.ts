import { describe, it, expect, beforeEach } from "vitest";
import { ProcurementService } from "../src/modules/procurement/procurement.service.js";
import { ProcurementController } from "../src/modules/procurement/procurement.controller.js";

describe("Procurement & Supply Chain Module", () => {
  let procurementService: ProcurementService;
  let procurementController: ProcurementController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = {
    tenant: { orgId: mockOrgId },
    headers: {},
    user: { id: "emp_1", name: "Nasif Kamal" },
  };

  beforeEach(() => {
    procurementService = new ProcurementService();
    procurementController = new ProcurementController(procurementService);
  });

  it("lists purchase requisitions with stats", () => {
    const list = procurementController.getRequisitions(mockReq);
    expect(list.length).toBeGreaterThanOrEqual(2);

    const stats = procurementController.getStats(mockReq);
    expect(stats.openRequisitions).toBeGreaterThan(0);
    expect(stats.totalCommittedSpendBDT).toBeGreaterThan(0);
  });

  it("creates a purchase requisition with sequential reference number", () => {
    const pr = procurementController.createRequisition(mockReq, {
      title: "School Library Bengali Story Books Batch-1",
      departmentName: "Education & Schools",
      officeLocation: "Rajshahi School Branch",
      justification: "Annual library textbook renewal.",
      currency: "BDT",
      items: [
        {
          itemDescription: "Primary Level Story Books (Bangla Sahitya)",
          category: "Books & Stationeries",
          quantity: 200,
          unit: "Copies",
          estimatedUnitPrice: 150,
        },
      ],
    });

    expect(pr.referenceNumber).toMatch(/^PR-\d{4}-\d{2}-\d{4}$/);
    expect(pr.estimatedTotalAmount).toBe(30000);
    expect(pr.items.length).toBe(1);
    expect(pr.status).toBe("QUOTING");
  });

  it("submits vendor quotes and generates comparative statement (CS)", () => {
    const pr = procurementController.createRequisition(mockReq, {
      title: "Classroom Whiteboards",
      departmentName: "Education & Schools",
      officeLocation: "Dhaka HQ",
      justification: "Replacement of damaged boards.",
      items: [
        {
          itemDescription: "Magnetic Whiteboards 4x6 ft",
          category: "Furniture",
          quantity: 10,
          unit: "Pcs",
          estimatedUnitPrice: 5000,
        },
      ],
    });

    // Submit Quote 1
    procurementController.submitVendorQuote(pr.id, mockReq, {
      vendorName: "Vendor Alpha Ltd.",
      quotedAmount: 48000,
      deliveryLeadDays: 5,
      warrantyPeriod: "1 Year",
      validUntil: "2026-09-30",
    });

    // Submit Quote 2 (Lowest bidder)
    procurementController.submitVendorQuote(pr.id, mockReq, {
      vendorName: "Vendor Beta Supplies",
      quotedAmount: 45000,
      deliveryLeadDays: 7,
      warrantyPeriod: "2 Years",
      validUntil: "2026-09-30",
    });

    const updatedPR = procurementController.getRequisitionById(pr.id, mockReq);
    expect(updatedPR.status).toBe("CS_READY");
    expect(updatedPR.quotes.length).toBe(2);

    const lowest = updatedPR.quotes.find((q) => q.isLowestBidder);
    expect(lowest?.vendorName).toBe("Vendor Beta Supplies");
    expect(lowest?.quotedAmount).toBe(45000);
  });

  it("issues a formal Purchase Order (PO) to the winning vendor", () => {
    const po = procurementController.issuePurchaseOrder("pr_101", mockReq, {
      vendorName: "Dhaka Scientific Instruments Ltd.",
      orderTotalAmount: 165000,
      paymentTerms: "Net 30 Days upon delivery",
      deliveryLocation: "Rajshahi School Branch",
      deliveryDeadline: "2026-08-30",
    });

    expect(po.poNumber).toMatch(/^PO-\d{4}-\d{2}-\d{4}$/);
    expect(po.vendorName).toBe("Dhaka Scientific Instruments Ltd.");
    expect(po.status).toBe("ISSUED");

    const pr = procurementController.getRequisitionById("pr_101", mockReq);
    expect(pr.status).toBe("PO_ISSUED");
    expect(pr.associatedPoNumber).toBe(po.poNumber);
  });
});
