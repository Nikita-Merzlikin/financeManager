import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ApiCommonHeaders } from "src/core/decorators/api-common-headers.decorator";
import {
  CreateFinancialPlanDto,
  FinancialPlanAiRecommendDto,
  FinancialPlanAiRecommendationResponseDto,
  FinancialPlanBaselineDto,
  FinancialPlanCategoryResponseDto,
  FinancialPlanDayResponseDto,
  FinancialPlanForecastDto,
  FinancialPlanPeriodResponseDto,
  FinancialPlanResponseDto,
  UpdateFinancialPlanDto,
} from "src/core/dto/financial-plan.dto";
import type { JwtPayload } from "src/core/types/jwt-payload.type";
import { FinancialPlanAiService } from "./financial-plan-ai.service";
import { FinancialPlanService } from "./financial-plan.service";

@ApiTags("financial-plans")
@ApiCommonHeaders()
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("financial-plans")
export class FinancialPlanController {
  constructor(
    private readonly planService: FinancialPlanService,
    private readonly planAiService: FinancialPlanAiService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a deterministic financial plan (no AI)" })
  @ApiOkResponse({ type: FinancialPlanResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFinancialPlanDto,
  ): Promise<FinancialPlanResponseDto> {
    return this.planService.create(user.sub, dto);
  }

  @Get("active")
  @ApiOperation({ summary: "Get the active financial plan with overview" })
  @ApiOkResponse({ type: FinancialPlanResponseDto })
  getActive(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanResponseDto> {
    return this.planService.getActive(user.sub);
  }

  @Patch("active")
  @ApiOperation({
    summary: "Update active plan (historical days stay locked)",
  })
  @ApiOkResponse({ type: FinancialPlanResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateFinancialPlanDto,
  ): Promise<FinancialPlanResponseDto> {
    return this.planService.update(user.sub, dto);
  }

  @Post("active/recalculate")
  @ApiOperation({ summary: "Recalculate future budgets from actual spending" })
  @ApiOkResponse({ type: FinancialPlanResponseDto })
  recalculate(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanResponseDto> {
    return this.planService.recalculate(user.sub);
  }

  @Get("active/periods")
  @ApiOkResponse({ type: FinancialPlanPeriodResponseDto, isArray: true })
  getPeriods(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanPeriodResponseDto[]> {
    return this.planService.getPeriods(user.sub);
  }

  @Get("active/calendar")
  @ApiOkResponse({ type: FinancialPlanDayResponseDto, isArray: true })
  getCalendar(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanDayResponseDto[]> {
    return this.planService.getCalendar(user.sub);
  }

  @Get("active/categories")
  @ApiOkResponse({ type: FinancialPlanCategoryResponseDto, isArray: true })
  getCategories(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanCategoryResponseDto[]> {
    return this.planService.getCategories(user.sub);
  }

  @Get("active/forecast")
  @ApiOkResponse({ type: FinancialPlanForecastDto })
  getForecast(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanForecastDto> {
    return this.planService.getForecast(user.sub);
  }

  @Get("active/baseline")
  @ApiOkResponse({ type: FinancialPlanBaselineDto })
  getBaseline(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanBaselineDto> {
    return this.planService.getBaseline(user.sub);
  }

  @Post("ai/recommend")
  @ApiOperation({
    summary: "Optional Gemini recommendation for a new plan (does not persist)",
  })
  @ApiOkResponse({ type: FinancialPlanAiRecommendationResponseDto })
  recommend(
    @CurrentUser() user: JwtPayload,
    @Body() dto: FinancialPlanAiRecommendDto,
  ): Promise<FinancialPlanAiRecommendationResponseDto> {
    return this.planAiService.recommend(user.sub, dto);
  }

  @Post("active/ai/analyze")
  @ApiOperation({
    summary: "Optional Gemini analysis of the active plan (read-only)",
  })
  @ApiOkResponse({ type: FinancialPlanAiRecommendationResponseDto })
  analyze(
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialPlanAiRecommendationResponseDto> {
    return this.planAiService.analyzeActive(user.sub);
  }
}
