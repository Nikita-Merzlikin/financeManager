import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { FINANCIAL_PLAN_MAX_CATEGORIES } from "src/core/constants/financial-plan.constants";
import { CurrencyEnum, DEFAULT_CURRENCY } from "src/core/enums/finance.enums";
import {
  FinancialPlanCategoryStatus,
  FinancialPlanDataStatus,
  FinancialPlanFrequency,
  FinancialPlanPeriodStatus,
  FinancialPlanRecommendationType,
  FinancialPlanStatus,
  FinancialPlanTrackStatus,
} from "src/core/enums/financial-plan.enums";

export class FinancialPlanCategoryLimitDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 8000, description: "Monthly limit in major units" })
  @IsNumber()
  @Min(0)
  limit!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class CreateFinancialPlanDto {
  @ApiProperty({
    example: 50000,
    description: "Average monthly income (major units)",
  })
  @IsNumber()
  @Min(0)
  income!: number;

  @ApiProperty({
    example: 35000,
    description: "Average monthly expenses before the plan (major units)",
  })
  @IsNumber()
  @Min(0)
  averageExpenses!: number;

  @ApiProperty({
    example: 10000,
    description: "Mandatory monthly expenses (major units)",
  })
  @IsNumber()
  @Min(0)
  mandatoryExpenses!: number;

  @ApiProperty({
    example: 5000,
    description: "Desired monthly savings (major units)",
  })
  @IsNumber()
  @Min(0)
  desiredSavings!: number;

  @ApiProperty({ example: "Emergency fund" })
  @IsString()
  @MaxLength(200)
  goal!: string;

  @ApiProperty({
    example: 100000,
    description: "Goal target amount (major units)",
  })
  @IsNumber()
  @Min(0.01)
  targetAmount!: number;

  @ApiProperty({ example: "2027-03-01" })
  @IsDateString()
  targetDate!: string;

  @ApiProperty({ enum: FinancialPlanFrequency })
  @IsEnum(FinancialPlanFrequency)
  frequency!: FinancialPlanFrequency;

  @ApiPropertyOptional({ enum: CurrencyEnum, default: DEFAULT_CURRENCY })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  currency?: CurrencyEnum;

  @ApiPropertyOptional({ type: [FinancialPlanCategoryLimitDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FINANCIAL_PLAN_MAX_CATEGORIES)
  @ValidateNested({ each: true })
  @Type(() => FinancialPlanCategoryLimitDto)
  categoryLimits?: FinancialPlanCategoryLimitDto[];
}

export class UpdateFinancialPlanDto {
  @ApiPropertyOptional({ example: 52000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  income?: number;

  @ApiPropertyOptional({ example: 34000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageExpenses?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mandatoryExpenses?: number;

  @ApiPropertyOptional({ example: 6000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  desiredSavings?: number;

  @ApiPropertyOptional({ example: "Vacation" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  goal?: string;

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  targetAmount?: number;

  @ApiPropertyOptional({ example: "2027-06-01" })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ enum: FinancialPlanFrequency })
  @IsOptional()
  @IsEnum(FinancialPlanFrequency)
  frequency?: FinancialPlanFrequency;

  @ApiPropertyOptional({ type: [FinancialPlanCategoryLimitDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FINANCIAL_PLAN_MAX_CATEGORIES)
  @ValidateNested({ each: true })
  @Type(() => FinancialPlanCategoryLimitDto)
  categoryLimits?: FinancialPlanCategoryLimitDto[];
}

export class FinancialPlanCategoryResponseDto {
  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: 8000 })
  limit!: number | null;

  @ApiProperty({ example: 4200 })
  actual!: number;

  @ApiPropertyOptional({ nullable: true, example: 3800 })
  remaining!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 52.5 })
  percentageUsed!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 3800 })
  variance!: number | null;

  @ApiProperty({ enum: FinancialPlanCategoryStatus })
  status!: FinancialPlanCategoryStatus;

  @ApiProperty()
  isMandatory!: boolean;
}

export class FinancialPlanDayResponseDto {
  @ApiProperty({ example: "2026-09-15" })
  date!: string;

  @ApiProperty({ example: 500 })
  planned!: number;

  @ApiProperty({ example: 420 })
  actual!: number;

  @ApiProperty({ example: 80 })
  remaining!: number;

  @ApiProperty({ example: 80 })
  variance!: number;

  @ApiProperty({ enum: FinancialPlanPeriodStatus })
  status!: FinancialPlanPeriodStatus;

  @ApiProperty()
  locked!: boolean;
}

export class FinancialPlanPeriodResponseDto {
  @ApiProperty({ example: "2026-09-01" })
  from!: string;

  @ApiProperty({ example: "2026-09-07" })
  to!: string;

  @ApiProperty({ example: 3500 })
  planned!: number;

  @ApiProperty({ example: 3100 })
  actual!: number;

  @ApiProperty({ example: 400 })
  remaining!: number;

  @ApiProperty({ example: 400 })
  saved!: number;

  @ApiProperty({ example: 400 })
  variance!: number;

  @ApiProperty({ enum: FinancialPlanPeriodStatus })
  status!: FinancialPlanPeriodStatus;
}

export class FinancialPlanProgressDto {
  @ApiProperty({ example: 25000 })
  accumulated!: number;

  @ApiProperty({ example: 100000 })
  targetAmount!: number;

  @ApiProperty({ example: 75000 })
  remaining!: number;

  @ApiProperty({ example: 25 })
  percentageComplete!: number;

  @ApiPropertyOptional({ nullable: true, example: "2027-02-15" })
  projectedCompletionDate!: string | null;
}

export class FinancialPlanOverviewDto {
  @ApiProperty({ example: 50000 })
  income!: number;

  @ApiProperty({ example: 35000 })
  plannedExpenses!: number;

  @ApiProperty({ example: 28000 })
  actualExpenses!: number;

  @ApiProperty({ example: 5000 })
  plannedSavings!: number;

  @ApiProperty({ example: 7000 })
  actualSavings!: number;

  @ApiProperty({ example: "Emergency fund" })
  goal!: string;

  @ApiProperty({ example: 100000 })
  targetAmount!: number;

  @ApiProperty({ type: FinancialPlanProgressDto })
  progress!: FinancialPlanProgressDto;
}

export class FinancialPlanCurrentPeriodDto {
  @ApiProperty({ example: "2026-09-15" })
  from!: string;

  @ApiProperty({ example: "2026-09-15" })
  to!: string;

  @ApiProperty({ example: 500 })
  planned!: number;

  @ApiProperty({ example: 420 })
  actual!: number;

  @ApiProperty({ example: 80 })
  remaining!: number;

  @ApiProperty({ example: 80 })
  saved!: number;

  @ApiProperty({ example: 80 })
  variance!: number;

  @ApiProperty({ enum: FinancialPlanPeriodStatus })
  status!: FinancialPlanPeriodStatus;
}

export class FinancialPlanResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: FinancialPlanStatus })
  status!: FinancialPlanStatus;

  @ApiProperty({ enum: FinancialPlanFrequency })
  frequency!: FinancialPlanFrequency;

  @ApiProperty({ example: DEFAULT_CURRENCY, enum: CurrencyEnum })
  currency!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  targetDate!: string;

  @ApiProperty({ example: 10000 })
  mandatoryExpenses!: number;

  @ApiProperty({ example: 35000 })
  averageExpenses!: number;

  @ApiProperty({ type: FinancialPlanOverviewDto })
  overview!: FinancialPlanOverviewDto;

  @ApiProperty({ type: FinancialPlanCurrentPeriodDto })
  currentPeriod!: FinancialPlanCurrentPeriodDto;

  @ApiProperty({ type: [FinancialPlanCategoryResponseDto] })
  categories!: FinancialPlanCategoryResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class FinancialPlanForecastDto {
  @ApiProperty({ enum: FinancialPlanDataStatus })
  dataStatus!: FinancialPlanDataStatus;

  @ApiProperty({ enum: FinancialPlanTrackStatus })
  trackStatus!: FinancialPlanTrackStatus;

  @ApiPropertyOptional({ nullable: true })
  expectedSpending!: number | null;

  @ApiPropertyOptional({ nullable: true })
  expectedSavings!: number | null;

  @ApiPropertyOptional({ nullable: true })
  expectedAccumulated!: number | null;

  @ApiPropertyOptional({ nullable: true })
  expectedCompletionDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  onTrack!: boolean | null;
}

export class FinancialPlanBaselineDto {
  @ApiProperty({ enum: FinancialPlanDataStatus })
  dataStatus!: FinancialPlanDataStatus;

  @ApiPropertyOptional({ nullable: true })
  historicalAverageMonthlyExpenses!: number | null;

  @ApiPropertyOptional({ nullable: true })
  projectedMonthlyExpensesUnderPlan!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Positive means saved more than the historical baseline",
  })
  savedVersusBaseline!: number | null;
}

export class FinancialPlanAiRecommendDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  income!: number;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  averageExpenses!: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  desiredSavings!: number;

  @ApiProperty({ example: "Emergency fund" })
  @IsString()
  @MaxLength(200)
  goal!: string;

  @ApiProperty({ example: "2027-03-01" })
  @IsDateString()
  targetDate!: string;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  targetAmount?: number;

  @ApiPropertyOptional({
    description: "Optional historical category spend hints for the model",
    example: [{ categoryId: "uuid", name: "Food", averageMonthly: 9000 }],
  })
  @IsOptional()
  @IsArray()
  categorySpending?: Array<{
    categoryId: string;
    name: string;
    averageMonthly: number;
  }>;
}

export class FinancialPlanAiRecommendationItemDto {
  @ApiProperty({ enum: FinancialPlanRecommendationType })
  type!: FinancialPlanRecommendationType;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  currentValue?: number;

  @ApiPropertyOptional()
  suggestedValue?: number;

  @ApiProperty()
  reason!: string;
}

export class FinancialPlanAiRecommendationResponseDto {
  @ApiProperty({ type: [FinancialPlanAiRecommendationItemDto] })
  recommendations!: FinancialPlanAiRecommendationItemDto[];

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  suggestedSavings?: number;

  @ApiPropertyOptional()
  suggestedCategoryLimits?: Array<{ categoryId: string; limit: number }>;
}

export class AcceptFinancialPlanAiDto extends CreateFinancialPlanDto {}
