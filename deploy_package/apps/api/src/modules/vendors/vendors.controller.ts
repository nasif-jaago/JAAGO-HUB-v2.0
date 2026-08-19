import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { VendorsService } from "./vendors.service.js";
import type {
  VendorProfileDto,
  OnboardVendorDto,
  UpdateVendorComplianceDto,
  VendorStatsDto,
} from "./dto/vendors.dto.js";

@ApiTags("Vendor Portal & Compliance")
@ApiBearerAuth()
@Controller("api/v1/vendors")
export class VendorsController {
  constructor(@Inject(VendorsService) private readonly vendorsService: VendorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List all onboarded vendors with category and compliance filters" })
  getVendors(
    @Query("category") category?: string,
    @Query("status") status?: string,
  ): VendorProfileDto[] {
    return this.vendorsService.getVendors(category, status);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: "Vendor self-onboarding registration" })
  onboardVendor(@Body() dto: OnboardVendorDto): VendorProfileDto {
    return this.vendorsService.onboardVendor(dto);
  }

  @Public()
  @Patch(":id/compliance")
  @ApiOperation({ summary: "Audit and update vendor compliance status & rating" })
  updateCompliance(
    @Param("id") id: string,
    @Body() dto: UpdateVendorComplianceDto,
  ): VendorProfileDto {
    return this.vendorsService.updateCompliance(id, dto);
  }

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get vendor compliance stats and active RFQ metrics" })
  getStats(): VendorStatsDto {
    return this.vendorsService.getStats();
  }
}
