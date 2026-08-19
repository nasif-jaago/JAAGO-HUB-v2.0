import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import { generateReferenceNumber } from "@jaago/integrations";
import type {
  StockItemDto,
  GoodsReceiptNoteDto,
  CreateGRNDto,
  StockDispatchDto,
  CreateStockDispatchDto,
  InventoryStatsDto,
} from "./dto/inventory.dto.js";

@Injectable()
export class InventoryService {
  private readonly stockItems: StockItemDto[] = [];
  private readonly grnRecords: GoodsReceiptNoteDto[] = [];
  private readonly dispatches: StockDispatchDto[] = [];
  private grnSequenceCounter = 12;
  private dspSequenceCounter = 5;

  constructor() {
    this.seedDefaultInventoryData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultInventoryData(): void {
    this.stockItems.push(
      {
        id: "stk_1",
        sku: "SKU-LAB-001",
        itemName: "Elementary Optical Microscope Kits",
        category: "LAB_EQUIPMENT",
        warehouseLocation: "Central Warehouse Dhaka (Bin A-12)",
        quantityOnHand: 25,
        reservedQuantity: 5,
        availableQuantity: 20,
        unit: "Sets",
        unitCostBDT: 5500,
        totalValuationBDT: 137500,
        reorderThreshold: 10,
        isLowStock: false,
        lastUpdated: "2026-08-12T10:00:00Z",
      },
      {
        id: "stk_2",
        sku: "SKU-KIT-002",
        itemName: "Solar Physics & Magnetism Activity Sets",
        category: "LEARNING_KITS",
        warehouseLocation: "Central Warehouse Dhaka (Bin B-04)",
        quantityOnHand: 45,
        reservedQuantity: 10,
        availableQuantity: 35,
        unit: "Sets",
        unitCostBDT: 2800,
        totalValuationBDT: 126000,
        reorderThreshold: 15,
        isLowStock: false,
        lastUpdated: "2026-08-14T09:00:00Z",
      },
      {
        id: "stk_3",
        sku: "SKU-IT-003",
        itemName: "10-inch Rugged Android Education Tablets",
        category: "IT_HARDWARE",
        warehouseLocation: "Central Warehouse Dhaka (Secure Bin IT-01)",
        quantityOnHand: 4,
        reservedQuantity: 0,
        availableQuantity: 4,
        unit: "Pcs",
        unitCostBDT: 13500,
        totalValuationBDT: 54000,
        reorderThreshold: 10,
        isLowStock: true,
        lastUpdated: "2026-08-10T14:00:00Z",
      },
      {
        id: "stk_4",
        sku: "SKU-BOK-004",
        itemName: "Primary Grade-3 Bangla & Math Workbooks",
        category: "BOOKS_STATIONERY",
        warehouseLocation: "Central Warehouse Dhaka (Bin C-01)",
        quantityOnHand: 500,
        reservedQuantity: 100,
        availableQuantity: 400,
        unit: "Copies",
        unitCostBDT: 120,
        totalValuationBDT: 60000,
        reorderThreshold: 150,
        isLowStock: false,
        lastUpdated: "2026-08-05T11:00:00Z",
      },
    );

    this.grnRecords.push({
      id: "grn_1",
      orgId: "00000000-0000-0000-0000-000000000000",
      grnNumber: "GRN-2026-08-0011",
      poNumber: "PO-2026-08-0009",
      vendorName: "Bengal Paper & Stationery Mart",
      warehouseLocation: "Central Warehouse Dhaka",
      receivedBy: "Zahid Hossain (Warehouse Supervisor)",
      receivedDate: "2026-08-11",
      status: "ACCEPTED",
      inspectionRemarks: "All 500 copies verified in pristine condition.",
      items: [
        {
          itemId: "gi_1",
          itemName: "Primary Grade-3 Bangla & Math Workbooks",
          orderedQuantity: 500,
          receivedQuantity: 500,
          acceptedQuantity: 500,
          rejectedQuantity: 0,
          unit: "Copies",
          unitPrice: 120,
        },
      ],
    });

    this.dispatches.push({
      id: "dsp_1",
      orgId: "00000000-0000-0000-0000-000000000000",
      dispatchNumber: "DSP-2026-08-0004",
      destinationBranch: "Rajshahi School Branch",
      requesterName: "Salma Khatun (Branch Head)",
      dispatchedBy: "Zahid Hossain",
      dispatchDate: "2026-08-13",
      carrierOrDriver: "Sundarban Courier Service",
      trackingOrVehicleNo: "SC-DHK-RAJ-9921",
      status: "IN_TRANSIT",
      totalItemsCount: 100,
      items: [
        {
          sku: "SKU-BOK-004",
          itemName: "Primary Grade-3 Bangla & Math Workbooks",
          quantity: 100,
          unit: "Copies",
        },
      ],
    });
  }

  // ─── Stock Ledger ──────────────────────────────────────────────────────────

  getStockLedger(search?: string, category?: string): StockItemDto[] {
    return this.stockItems.filter((item) => {
      if (category && item.category !== category) return false;
      if (search) {
        const query = search.toLowerCase();
        return (
          item.itemName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.warehouseLocation.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }

  // ─── Goods Receipt Note (GRN) ──────────────────────────────────────────────

  getGRNRecords(orgId: string): GoodsReceiptNoteDto[] {
    return this.grnRecords
      .filter((g) => g.orgId === orgId)
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }

  createGoodsReceiptNote(
    orgId: string,
    receivedBy: string,
    dto: CreateGRNDto,
  ): GoodsReceiptNoteDto {
    this.grnSequenceCounter += 1;
    const grnNumber = generateReferenceNumber({
      documentType: "GOODS_RECEIPT",
      sequence: this.grnSequenceCounter,
    });

    const id = `grn_${Date.now().toString(36)}`;
    const items = dto.items.map((item, idx) => ({
      itemId: `gi_${Date.now().toString(36)}_${idx}`,
      itemName: item.itemName,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      acceptedQuantity: item.acceptedQuantity,
      rejectedQuantity: item.rejectedQuantity || 0,
      unit: item.unit,
      unitPrice: item.unitPrice,
    }));

    const grn: GoodsReceiptNoteDto = {
      id,
      orgId,
      grnNumber,
      poNumber: dto.poNumber,
      vendorName: dto.vendorName,
      warehouseLocation: dto.warehouseLocation,
      receivedBy,
      receivedDate: new Date().toISOString().split("T")[0]!,
      status: "ACCEPTED",
      inspectionRemarks: dto.inspectionRemarks,
      items,
    };

    this.grnRecords.unshift(grn);

    // Update Stock Ledger: Increment quantity or create SKU if new
    for (const item of items) {
      if (item.acceptedQuantity > 0) {
        const existing = this.stockItems.find(
          (s) => s.itemName.toLowerCase() === item.itemName.toLowerCase(),
        );

        if (existing) {
          // Compute new weighted average cost
          const currentVal = existing.quantityOnHand * existing.unitCostBDT;
          const newVal = item.acceptedQuantity * item.unitPrice;
          const totalQty = existing.quantityOnHand + item.acceptedQuantity;

          existing.unitCostBDT = Math.round((currentVal + newVal) / totalQty);
          existing.quantityOnHand = totalQty;
          existing.availableQuantity = existing.quantityOnHand - existing.reservedQuantity;
          existing.totalValuationBDT = existing.quantityOnHand * existing.unitCostBDT;
          existing.isLowStock = existing.availableQuantity <= existing.reorderThreshold;
          existing.lastUpdated = new Date().toISOString();
        } else {
          const sku = `SKU-GEN-${Math.floor(100 + Math.random() * 900)}`;
          const totalVal = item.acceptedQuantity * item.unitPrice;
          this.stockItems.push({
            id: `stk_${Date.now().toString(36)}`,
            sku,
            itemName: item.itemName,
            category: "GENERAL",
            warehouseLocation: dto.warehouseLocation,
            quantityOnHand: item.acceptedQuantity,
            reservedQuantity: 0,
            availableQuantity: item.acceptedQuantity,
            unit: item.unit,
            unitCostBDT: item.unitPrice,
            totalValuationBDT: totalVal,
            reorderThreshold: 10,
            isLowStock: false,
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    }

    this.safeLog(
      { orgId, grnNumber, po: dto.poNumber, vendor: dto.vendorName, totalItems: items.length },
      `Generated GRN ${grnNumber} for ${dto.vendorName}`,
    );

    return grn;
  }

  // ─── Stock Dispatches & Branch Transfers ───────────────────────────────────

  getDispatches(orgId: string): StockDispatchDto[] {
    return this.dispatches
      .filter((d) => d.orgId === orgId)
      .sort((a, b) => new Date(b.dispatchDate).getTime() - new Date(a.dispatchDate).getTime());
  }

  createStockDispatch(
    orgId: string,
    dispatchedBy: string,
    dto: CreateStockDispatchDto,
  ): StockDispatchDto {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Dispatch note must contain at least one item.");
    }

    // Verify stock availability
    for (const reqItem of dto.items) {
      const stock = this.stockItems.find((s) => s.sku === reqItem.sku);
      if (!stock) {
        throw new NotFoundException(`Item with SKU ${reqItem.sku} not found in inventory.`);
      }
      if (stock.availableQuantity < reqItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${stock.itemName} (${stock.sku}). Available: ${stock.availableQuantity} ${stock.unit}, Requested: ${reqItem.quantity}`,
        );
      }
    }

    this.dspSequenceCounter += 1;
    const dispatchNumber = generateReferenceNumber({
      documentType: "STOCK_DISPATCH",
      sequence: this.dspSequenceCounter,
    });

    const dispatchItems = dto.items.map((reqItem) => {
      const stock = this.stockItems.find((s) => s.sku === reqItem.sku)!;
      // Deduct from warehouse stock
      stock.quantityOnHand -= reqItem.quantity;
      stock.availableQuantity = stock.quantityOnHand - stock.reservedQuantity;
      stock.totalValuationBDT = stock.quantityOnHand * stock.unitCostBDT;
      stock.isLowStock = stock.availableQuantity <= stock.reorderThreshold;
      stock.lastUpdated = new Date().toISOString();

      return {
        sku: stock.sku,
        itemName: stock.itemName,
        quantity: reqItem.quantity,
        unit: stock.unit,
      };
    });

    const totalCount = dispatchItems.reduce((sum, item) => sum + item.quantity, 0);

    const dispatch: StockDispatchDto = {
      id: `dsp_${Date.now().toString(36)}`,
      orgId,
      dispatchNumber,
      destinationBranch: dto.destinationBranch,
      requesterName: "Branch Operations In-Charge",
      dispatchedBy,
      dispatchDate: new Date().toISOString().split("T")[0]!,
      carrierOrDriver: dto.carrierOrDriver,
      trackingOrVehicleNo: dto.trackingOrVehicleNo,
      status: "IN_TRANSIT",
      totalItemsCount: totalCount,
      items: dispatchItems,
    };

    this.dispatches.unshift(dispatch);

    this.safeLog(
      { orgId, dispatchNumber, branch: dto.destinationBranch, itemsCount: totalCount },
      `Created Branch Dispatch ${dispatchNumber} to ${dto.destinationBranch}`,
    );

    return dispatch;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): InventoryStatsDto {
    const totalValuation = this.stockItems.reduce((sum, s) => sum + s.totalValuationBDT, 0);
    const lowStockCount = this.stockItems.filter((s) => s.isLowStock).length;
    const activeDispatchesCount = this.dispatches.filter((d) => d.status === "IN_TRANSIT" || d.status === "PREPARED").length;

    return {
      totalSkus: this.stockItems.length,
      totalValuationBDT: totalValuation,
      lowStockAlerts: lowStockCount,
      activeDispatches: activeDispatchesCount,
    };
  }
}
