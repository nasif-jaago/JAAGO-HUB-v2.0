import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { InventoryService } from "./inventory.service.js";
import type {
  StockItemDto,
  GoodsReceiptNoteDto,
  CreateGRNDto,
  StockDispatchDto,
  CreateStockDispatchDto,
  InventoryStatsDto,
} from "./dto/inventory.dto.js";

@ApiTags("Inventory & Warehousing")
@ApiBearerAuth()
@Controller("api/v1/inventory")
export class InventoryController {
  constructor(@Inject(InventoryService) private readonly inventoryService: InventoryService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── Stock Ledger ──────────────────────────────────────────────────────────

  @Public()
  @Get("stock")
  @ApiOperation({ summary: "Get warehouse stock ledger with search and category filters" })
  getStockLedger(
    @Query("search") search?: string,
    @Query("category") category?: string,
  ): StockItemDto[] {
    return this.inventoryService.getStockLedger(search, category);
  }

  // ─── Goods Receipt Notes (GRN) ─────────────────────────────────────────────

  @Public()
  @Get("grn")
  @ApiOperation({ summary: "List Goods Receipt Notes (GRN)" })
  getGRNRecords(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): GoodsReceiptNoteDto[] {
    const orgId = this.resolveOrgId(req);
    return this.inventoryService.getGRNRecords(orgId);
  }

  @Public()
  @Post("grn")
  @ApiOperation({ summary: "Create Goods Receipt Note (GRN) from delivered PO items" })
  createGoodsReceiptNote(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string>; user?: { name?: string } },
    @Body() dto: CreateGRNDto,
  ): GoodsReceiptNoteDto {
    const orgId = this.resolveOrgId(req);
    const receivedBy = req.user?.name || "Warehouse Manager";
    return this.inventoryService.createGoodsReceiptNote(orgId, receivedBy, dto);
  }

  // ─── Dispatches & Branch Transfers ─────────────────────────────────────────

  @Public()
  @Get("dispatches")
  @ApiOperation({ summary: "List branch stock dispatch notes" })
  getDispatches(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): StockDispatchDto[] {
    const orgId = this.resolveOrgId(req);
    return this.inventoryService.getDispatches(orgId);
  }

  @Public()
  @Post("dispatches")
  @ApiOperation({ summary: "Create branch stock dispatch note and deduct inventory" })
  createStockDispatch(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string>; user?: { name?: string } },
    @Body() dto: CreateStockDispatchDto,
  ): StockDispatchDto {
    const orgId = this.resolveOrgId(req);
    const dispatchedBy = req.user?.name || "Warehouse Dispatch Officer";
    return this.inventoryService.createStockDispatch(orgId, dispatchedBy, dto);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get inventory valuation and low stock KPI statistics" })
  getStats(): InventoryStatsDto {
    return this.inventoryService.getStats();
  }
}
