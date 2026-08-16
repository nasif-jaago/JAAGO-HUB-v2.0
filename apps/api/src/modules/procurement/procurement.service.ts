import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import { generateReferenceNumber } from "@jaago/integrations";
import type {
  PurchaseRequisitionDto,
  CreatePRDto,
  SubmitVendorQuoteDto,
  VendorQuoteDto,
  PurchaseOrderDto,
  IssuePODto,
} from "./dto/procurement.dto.js";

@Injectable()
export class ProcurementService {
  private readonly requisitions: PurchaseRequisitionDto[] = [];
  private readonly purchaseOrders: PurchaseOrderDto[] = [];
  private prSequenceCounter = 40;
  private poSequenceCounter = 10;

  constructor() {
    this.seedDefaultProcurementData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in unit tests
    }
  }

  private seedDefaultProcurementData(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.requisitions.push(
      {
        id: "pr_101",
        orgId,
        referenceNumber: "PR-2026-08-0041",
        title: "Primary School Science & Math Lab Kits",
        departmentName: "Education & Schools",
        officeLocation: "Rajshahi School Branch",
        requesterId: "emp_2",
        requesterName: "Salma Khatun",
        estimatedTotalAmount: 180000,
        currency: "BDT",
        justification: "Equipping 120 students in STEM practical science kits for Q3 syllabus.",
        status: "CS_READY",
        items: [
          {
            id: "pri_1",
            itemDescription: "Elementary Optical Microscope Kits",
            category: "Lab Equipment",
            quantity: 15,
            unit: "Sets",
            estimatedUnitPrice: 6000,
            totalEstimatedPrice: 90000,
          },
          {
            id: "pri_2",
            itemDescription: "Solar Physics & Magnetism Activity Sets",
            category: "Learning Kits",
            quantity: 30,
            unit: "Sets",
            estimatedUnitPrice: 3000,
            totalEstimatedPrice: 90000,
          },
        ],
        quotes: [
          {
            id: "q_1",
            vendorId: "v_dhaka_sci",
            vendorName: "Dhaka Scientific Instruments Ltd.",
            quotedAmount: 165000,
            deliveryLeadDays: 7,
            warrantyPeriod: "1 Year Official Warranty",
            validUntil: "2026-09-15",
            isLowestBidder: true,
            isRecommended: true,
            remarks: "Complete compliance with school safety standards.",
            submittedAt: "2026-08-12T10:00:00Z",
          },
          {
            id: "q_2",
            vendorId: "v_apex_edu",
            vendorName: "Apex Educational Supplies",
            quotedAmount: 178000,
            deliveryLeadDays: 10,
            warrantyPeriod: "6 Months",
            validUntil: "2026-09-10",
            isLowestBidder: false,
            isRecommended: false,
            remarks: "Standard commercial kits.",
            submittedAt: "2026-08-13T14:00:00Z",
          },
        ],
        createdAt: "2026-08-10T09:00:00Z",
      },
      {
        id: "pr_102",
        orgId,
        referenceNumber: "PR-2026-08-0042",
        title: "Classroom Student Android Learning Tablets",
        departmentName: "Education & Schools",
        officeLocation: "Dhaka HQ (Banani)",
        requesterId: "emp_1",
        requesterName: "Nasif Kamal",
        estimatedTotalAmount: 350000,
        currency: "BDT",
        justification: "Digital literacy program for Bandarban & Habiganj schools.",
        status: "QUOTING",
        items: [
          {
            id: "pri_3",
            itemDescription: "10-inch Rugged Android Education Tablets",
            category: "IT Hardware",
            quantity: 25,
            unit: "Pcs",
            estimatedUnitPrice: 14000,
            totalEstimatedPrice: 350000,
          },
        ],
        quotes: [],
        createdAt: "2026-08-14T11:30:00Z",
      },
    );

    this.purchaseOrders.push({
      id: "po_101",
      orgId,
      poNumber: "PO-2026-08-0009",
      prId: "pr_100",
      prReference: "PR-2026-07-0038",
      vendorId: "v_paper_hub",
      vendorName: "Bengal Paper & Stationery Mart",
      orderTotalAmount: 64000,
      currency: "BDT",
      paymentTerms: "Net 30 Days after inspection",
      deliveryLocation: "Dhaka HQ Central Warehouse",
      deliveryDeadline: "2026-08-25",
      status: "ISSUED",
      issuedAt: "2026-08-05T00:00:00Z",
    });
  }

  // ─── Purchase Requisitions ─────────────────────────────────────────────────

  getRequisitions(orgId: string, status?: string): PurchaseRequisitionDto[] {
    return this.requisitions
      .filter((pr) => pr.orgId === orgId && (!status || pr.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getRequisitionById(orgId: string, id: string): PurchaseRequisitionDto {
    const pr = this.requisitions.find((p) => (p.id === id || p.referenceNumber === id) && p.orgId === orgId);
    if (!pr) {
      throw new NotFoundException(`Purchase Requisition ${id} not found`);
    }
    return pr;
  }

  createRequisition(
    orgId: string,
    requester: { id: string; fullName: string },
    dto: CreatePRDto,
  ): PurchaseRequisitionDto {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Purchase Requisition must contain at least one item line.");
    }

    this.prSequenceCounter += 1;
    const referenceNumber = generateReferenceNumber({
      documentType: "PURCHASE_REQUISITION",
      sequence: this.prSequenceCounter,
    });

    const id = `pr_${Date.now().toString(36)}`;
    let estimatedTotal = 0;

    const items = dto.items.map((item, idx) => {
      const lineTotal = item.quantity * item.estimatedUnitPrice;
      estimatedTotal += lineTotal;
      return {
        id: `pri_${Date.now().toString(36)}_${idx}`,
        itemDescription: item.itemDescription,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimatedUnitPrice: item.estimatedUnitPrice,
        totalEstimatedPrice: lineTotal,
      };
    });

    const newPr: PurchaseRequisitionDto = {
      id,
      orgId,
      referenceNumber,
      title: dto.title,
      departmentName: dto.departmentName,
      officeLocation: dto.officeLocation,
      requesterId: requester.id,
      requesterName: requester.fullName,
      estimatedTotalAmount: estimatedTotal,
      currency: dto.currency || "BDT",
      justification: dto.justification,
      status: "QUOTING",
      items,
      quotes: [],
      createdAt: new Date().toISOString(),
    };

    this.requisitions.unshift(newPr);
    this.safeLog(
      { orgId, prId: id, ref: referenceNumber, total: estimatedTotal },
      `Created Purchase Requisition ${referenceNumber}: ${dto.title}`,
    );

    return newPr;
  }

  submitVendorQuote(orgId: string, prId: string, dto: SubmitVendorQuoteDto): VendorQuoteDto {
    const pr = this.getRequisitionById(orgId, prId);
    const quoteId = `q_${Date.now().toString(36)}`;

    const quote: VendorQuoteDto = {
      id: quoteId,
      vendorId: `v_${dto.vendorName.toLowerCase().replace(/\s+/g, "_")}`,
      vendorName: dto.vendorName,
      quotedAmount: dto.quotedAmount,
      deliveryLeadDays: dto.deliveryLeadDays,
      warrantyPeriod: dto.warrantyPeriod,
      validUntil: dto.validUntil,
      remarks: dto.remarks,
      submittedAt: new Date().toISOString(),
    };

    pr.quotes.push(quote);

    // Recompute Comparative Statement (Lowest Bidder highlight)
    const minAmount = Math.min(...pr.quotes.map((q) => q.quotedAmount));
    for (const q of pr.quotes) {
      q.isLowestBidder = q.quotedAmount === minAmount;
      q.isRecommended = q.isLowestBidder;
    }

    if (pr.quotes.length >= 2 && pr.status === "QUOTING") {
      pr.status = "CS_READY";
    }

    this.safeLog({ orgId, prId, vendor: dto.vendorName, quoteAmount: dto.quotedAmount }, `Submitted quote for ${pr.referenceNumber}`);
    return quote;
  }

  // ─── Purchase Orders ───────────────────────────────────────────────────────

  getPurchaseOrders(orgId: string): PurchaseOrderDto[] {
    return this.purchaseOrders
      .filter((po) => po.orgId === orgId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  issuePurchaseOrder(orgId: string, prId: string, dto: IssuePODto): PurchaseOrderDto {
    const pr = this.getRequisitionById(orgId, prId);

    this.poSequenceCounter += 1;
    const poNumber = generateReferenceNumber({
      documentType: "PURCHASE_ORDER",
      sequence: this.poSequenceCounter,
    });

    const id = `po_${Date.now().toString(36)}`;
    const po: PurchaseOrderDto = {
      id,
      orgId,
      poNumber,
      prId: pr.id,
      prReference: pr.referenceNumber,
      vendorId: `v_${dto.vendorName.toLowerCase().replace(/\s+/g, "_")}`,
      vendorName: dto.vendorName,
      orderTotalAmount: dto.orderTotalAmount,
      currency: pr.currency,
      paymentTerms: dto.paymentTerms || "Net 30 Days upon GRN verification",
      deliveryLocation: dto.deliveryLocation,
      deliveryDeadline: dto.deliveryDeadline,
      status: "ISSUED",
      issuedAt: new Date().toISOString(),
    };

    this.purchaseOrders.unshift(po);

    // Update PR Status
    pr.status = "PO_ISSUED";
    pr.awardedVendorName = dto.vendorName;
    pr.associatedPoNumber = poNumber;

    this.safeLog(
      { orgId, poNumber, prRef: pr.referenceNumber, vendor: dto.vendorName, total: dto.orderTotalAmount },
      `Generated and issued Purchase Order ${poNumber} to ${dto.vendorName}`,
    );

    return po;
  }

  getStats(orgId: string) {
    const orgPrs = this.requisitions.filter((p) => p.orgId === orgId);
    const orgPos = this.purchaseOrders.filter((p) => p.orgId === orgId);

    const totalCommittedSpend = orgPos.reduce((sum, po) => sum + po.orderTotalAmount, 0);

    return {
      openRequisitions: orgPrs.filter((p) => p.status !== "PO_ISSUED" && p.status !== "DELIVERED").length,
      csInReview: orgPrs.filter((p) => p.status === "CS_READY").length,
      issuedPOs: orgPos.length,
      totalCommittedSpendBDT: totalCommittedSpend,
    };
  }
}
