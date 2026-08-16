export type ItemCategory = "LAB_EQUIPMENT" | "LEARNING_KITS" | "IT_HARDWARE" | "BOOKS_STATIONERY" | "UNIFORMS" | "FURNITURE" | "GENERAL";
export type GRNStatus = "PENDING_INSPECTION" | "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED";
export type DispatchStatus = "PREPARED" | "IN_TRANSIT" | "DELIVERED" | "ACKNOWLEDGED";

export interface StockItemDto {
  id: string;
  sku: string; // e.g. SKU-LAB-001
  itemName: string;
  category: ItemCategory;
  warehouseLocation: string; // e.g. Central Warehouse Dhaka (Bin A-12)
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: string;
  unitCostBDT: number;
  totalValuationBDT: number;
  reorderThreshold: number;
  isLowStock: boolean;
  lastUpdated: string;
}

export interface GoodsReceiptNoteDto {
  id: string;
  orgId: string;
  grnNumber: string; // e.g. GRN-2026-08-0012
  poNumber: string;
  vendorName: string;
  warehouseLocation: string;
  receivedBy: string;
  receivedDate: string;
  status: GRNStatus;
  inspectionRemarks?: string | undefined;
  items: Array<{
    itemId: string;
    itemName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    unit: string;
    unitPrice: number;
  }>;
}

export interface CreateGRNDto {
  poNumber: string;
  vendorName: string;
  warehouseLocation: string;
  inspectionRemarks?: string | undefined;
  items: Array<{
    itemName: string;
    category?: ItemCategory | undefined;
    orderedQuantity: number;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity?: number | undefined;
    unit: string;
    unitPrice: number;
  }>;
}

export interface StockDispatchDto {
  id: string;
  orgId: string;
  dispatchNumber: string; // e.g. DSP-2026-08-0005
  destinationBranch: string; // e.g. Rajshahi School Branch
  requesterName: string;
  dispatchedBy: string;
  dispatchDate: string;
  carrierOrDriver: string;
  trackingOrVehicleNo: string;
  status: DispatchStatus;
  totalItemsCount: number;
  items: Array<{
    sku: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
}

export interface CreateStockDispatchDto {
  destinationBranch: string;
  carrierOrDriver: string;
  trackingOrVehicleNo: string;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
}

export interface InventoryStatsDto {
  totalSkus: number;
  totalValuationBDT: number;
  lowStockAlerts: number;
  activeDispatches: number;
}
