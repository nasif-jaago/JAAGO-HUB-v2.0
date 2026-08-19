import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { ProcurementService } from "./procurement.service.js";
import type {
  PurchaseRequisitionDto,
  CreatePRDto,
  SubmitVendorQuoteDto,
  VendorQuoteDto,
  PurchaseOrderDto,
  IssuePODto,
} from "./dto/procurement.dto.js";

@ApiTags("Procurement & Supply Chain")
@ApiBearerAuth()
@Controller("api/v1/procurement")
export class ProcurementController {
  constructor(@Inject(ProcurementService) private readonly procurementService: ProcurementService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── Purchase Requisitions ─────────────────────────────────────────────────

  @Public()
  @Get("pr")
  @ApiOperation({ summary: "List Purchase Requisitions with status filters" })
  getRequisitions(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("status") status?: string,
  ): PurchaseRequisitionDto[] {
    const orgId = this.resolveOrgId(req);
    return this.procurementService.getRequisitions(orgId, status);
  }

  @Public()
  @Get("pr/:id")
  @ApiOperation({ summary: "Get detailed Purchase Requisition with quotes and CS matrix" })
  getRequisitionById(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
  ): PurchaseRequisitionDto {
    const orgId = this.resolveOrgId(req);
    return this.procurementService.getRequisitionById(orgId, id);
  }

  @Public()
  @Post("pr")
  @ApiOperation({ summary: "Create a new Purchase Requisition with auto-reference number" })
  createRequisition(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string>; user?: { id?: string; name?: string } },
    @Body() dto: CreatePRDto,
  ): PurchaseRequisitionDto {
    const orgId = this.resolveOrgId(req);
    const requester = {
      id: req.user?.id || "emp_1",
      fullName: req.user?.name || "Nasif Kamal",
    };
    return this.procurementService.createRequisition(orgId, requester, dto);
  }

  @Public()
  @Post("pr/:id/quotes")
  @ApiOperation({ summary: "Submit vendor quotation for Purchase Requisition" })
  submitVendorQuote(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: SubmitVendorQuoteDto,
  ): VendorQuoteDto {
    const orgId = this.resolveOrgId(req);
    return this.procurementService.submitVendorQuote(orgId, id, dto);
  }

  // ─── Purchase Orders ───────────────────────────────────────────────────────

  @Public()
  @Get("po")
  @ApiOperation({ summary: "List issued Purchase Orders" })
  getPurchaseOrders(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): PurchaseOrderDto[] {
    const orgId = this.resolveOrgId(req);
    return this.procurementService.getPurchaseOrders(orgId);
  }

  @Public()
  @Post("pr/:id/po")
  @ApiOperation({ summary: "Issue Purchase Order upon CS approval" })
  issuePurchaseOrder(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: IssuePODto,
  ): PurchaseOrderDto {
    const orgId = this.resolveOrgId(req);
    return this.procurementService.issuePurchaseOrder(orgId, id, dto);
  }

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get procurement KPIs and commit spend totals" })
  getStats(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }) {
    const orgId = this.resolveOrgId(req);
    return this.procurementService.getStats(orgId);
  }
}
