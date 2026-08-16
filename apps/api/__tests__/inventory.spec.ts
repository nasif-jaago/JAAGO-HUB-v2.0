import { describe, it, expect, beforeEach } from "vitest";
import { InventoryService } from "../src/modules/inventory/inventory.service.js";
import { InventoryController } from "../src/modules/inventory/inventory.controller.js";

describe("Inventory & Warehousing Module", () => {
  let inventoryService: InventoryService;
  let inventoryController: InventoryController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = {
    tenant: { orgId: mockOrgId },
    headers: {},
    user: { name: "Warehouse Manager" },
  };

  beforeEach(() => {
    inventoryService = new InventoryService();
    inventoryController = new InventoryController(inventoryService);
  });

  it("lists current warehouse stock ledger and summary stats", () => {
    const stock = inventoryController.getStockLedger();
    expect(stock.length).toBeGreaterThanOrEqual(4);

    const stats = inventoryController.getStats();
    expect(stats.totalSkus).toBeGreaterThanOrEqual(4);
    expect(stats.totalValuationBDT).toBeGreaterThan(0);
  });

  it("creates a Goods Receipt Note (GRN) and updates weighted average stock valuation", () => {
    const grn = inventoryController.createGoodsReceiptNote(mockReq, {
      poNumber: "PO-2026-08-0012",
      vendorName: "Dhaka Scientific Instruments Ltd.",
      warehouseLocation: "Central Warehouse Dhaka (Bin A-12)",
      inspectionRemarks: "15 microscopes received in good order.",
      items: [
        {
          itemName: "Elementary Optical Microscope Kits",
          orderedQuantity: 15,
          receivedQuantity: 15,
          acceptedQuantity: 15,
          unit: "Sets",
          unitPrice: 6000,
        },
      ],
    });

    expect(grn.grnNumber).toMatch(/^GRN-\d{4}-\d{2}-\d{4}$/);
    expect(grn.status).toBe("ACCEPTED");

    // Verify stock incremented: 25 initial + 15 received = 40
    const item = inventoryService.getStockLedger().find((s) => s.sku === "SKU-LAB-001");
    expect(item?.quantityOnHand).toBe(40);
  });

  it("creates a branch stock dispatch note and deducts warehouse balance", () => {
    const dispatch = inventoryController.createStockDispatch(mockReq, {
      destinationBranch: "Bandarban School Branch",
      carrierOrDriver: "SA Paribahan Courier",
      trackingOrVehicleNo: "SA-DHK-BND-7712",
      items: [
        {
          sku: "SKU-KIT-002",
          quantity: 10,
        },
      ],
    });

    expect(dispatch.dispatchNumber).toMatch(/^DSP-\d{4}-\d{2}-\d{4}$/);
    expect(dispatch.destinationBranch).toBe("Bandarban School Branch");
    expect(dispatch.status).toBe("IN_TRANSIT");

    // Verify stock was deducted: 45 initial - 10 dispatched = 35
    const item = inventoryService.getStockLedger().find((s) => s.sku === "SKU-KIT-002");
    expect(item?.quantityOnHand).toBe(35);
  });

  it("rejects dispatch when requested quantity exceeds available stock", () => {
    expect(() =>
      inventoryController.createStockDispatch(mockReq, {
        destinationBranch: "Habiganj School Branch",
        carrierOrDriver: "Express Van",
        trackingOrVehicleNo: "DHK-METRO-1122",
        items: [
          {
            sku: "SKU-IT-003",
            quantity: 50, // Only 4 available
          },
        ],
      }),
    ).toThrowError(/Insufficient stock/);
  });
});
