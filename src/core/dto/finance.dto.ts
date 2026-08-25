import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateAccountDto {
  @ApiProperty({ example: "Cash" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    enum: ["cash", "card", "bank", "jar", "fop", "other"],
    default: "card",
  })
  @IsOptional()
  @IsIn(["cash", "card", "bank", "jar", "fop", "other"])
  type?: "cash" | "card" | "bank" | "jar" | "fop" | "other";

  @ApiPropertyOptional({ example: "UAH", default: "UAH" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional({ example: "UA123..." })
  @IsOptional()
  @IsString()
  iban?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: "Main card" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    enum: ["cash", "card", "bank", "jar", "fop", "other"],
  })
  @IsOptional()
  @IsIn(["cash", "card", "bank", "jar", "fop", "other"])
  type?: "cash" | "card" | "bank" | "jar" | "fop" | "other";

  @ApiPropertyOptional({ example: 1500.5 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;
}

export class AccountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ example: 1200.5 })
  balance!: number;

  @ApiPropertyOptional({ nullable: true })
  iban!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ nullable: true })
  bankConnectionId!: string | null;
}

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  accountId!: string;

  @ApiProperty({ enum: ["income", "expense"] })
  @IsIn(["income", "expense"])
  type!: "income" | "expense";

  @ApiProperty({ example: 250.5 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: "UAH" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "Grocery" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: "2026-08-21T12:00:00.000Z" })
  @IsOptional()
  @IsString()
  occurredAt?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: ["income", "expense"] })
  @IsOptional()
  @IsIn(["income", "expense"])
  type?: "income" | "expense";

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occurredAt?: string;
}

export class TransactionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  accountId!: string;

  @ApiPropertyOptional({ nullable: true })
  categoryId!: string | null;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  occurredAt!: Date;

  @ApiProperty()
  source!: string;
}

export class CategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  icon!: string | null;
}

export class CreateCategoryDto {
  @ApiProperty({ example: "Food" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: ["income", "expense"] })
  @IsIn(["income", "expense"])
  type!: "income" | "expense";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}

export class ConnectMonobankDto {
  @ApiProperty({
    description: "Personal X-Token from https://api.monobank.ua/",
  })
  @IsString()
  token!: string;

  @ApiPropertyOptional({ example: "My Mono" })
  @IsOptional()
  @IsString()
  label?: string;
}

export class ConnectPrivatDto {
  @ApiProperty({ description: "AutoClient id from Privat24 Business" })
  @IsString()
  clientId!: string;

  @ApiProperty({ description: "AutoClient token from Privat24 Business" })
  @IsString()
  token!: string;

  @ApiProperty({
    description: "FOP account IBAN to sync",
    example: "UA123456789012345678901234567",
  })
  @IsString()
  iban!: string;

  @ApiPropertyOptional({ example: "Privat FOP" })
  @IsOptional()
  @IsString()
  label?: string;
}

export class SyncBankDto {
  @ApiPropertyOptional({
    description: "Days to sync back (default 30, max 90)",
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;
}

export class DashboardDto {
  @ApiProperty({ example: 15420.55 })
  balance!: number;

  @ApiProperty({ example: 32000 })
  income!: number;

  @ApiProperty({ example: 18500.4 })
  expenses!: number;

  @ApiProperty({ example: 4500 })
  savings!: number;

  @ApiProperty({ example: 13500 })
  net!: number;

  @ApiProperty({ example: "UAH" })
  currency!: string;

  @ApiProperty()
  period!: { from: string; to: string };

  @ApiProperty({ type: [AccountDto] })
  accounts!: AccountDto[];

  @ApiProperty({
    example: [{ date: "2026-08-01", income: 100, expense: 50 }],
  })
  dailySeries!: Array<{ date: string; income: number; expense: number }>;

  @ApiProperty({
    example: [{ categoryId: null, name: "Other", type: "expense", total: 200 }],
  })
  byCategory!: Array<{
    categoryId: string | null;
    name: string;
    type: string;
    total: number;
  }>;
}
