import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { IsIban } from "src/core/decorators/is-iban.decorator";
import {
  AccountSource,
  AccountType,
  BankProvider,
  CurrencyEnum,
  DEFAULT_ACCOUNT_TYPE,
  DEFAULT_CURRENCY,
  TransactionType,
} from "src/core/enums/finance.enums";

export class CreateAccountDto {
  @ApiProperty({ example: "Cash" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: AccountType, default: DEFAULT_ACCOUNT_TYPE })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: DEFAULT_CURRENCY, default: DEFAULT_CURRENCY, enum: CurrencyEnum })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional({ example: "UA903052990004149123456789012" })
  @IsOptional()
  @IsIban()
  iban?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: "Main card" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: 1500.5 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "UA903052990004149123456789012" })
  @IsOptional()
  @IsIban()
  iban?: string;
}

export class AccountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AccountSource })
  source!: AccountSource;

  @ApiProperty({ enum: AccountType })
  type!: AccountType;

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

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 250.5 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: DEFAULT_CURRENCY, enum: CurrencyEnum })
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
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

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

  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  occurredAt!: Date;

  @ApiProperty({ enum: AccountSource })
  source!: AccountSource;
}

export class CategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @ApiPropertyOptional({ nullable: true })
  icon!: string | null;
}

export class CreateCategoryDto {
  @ApiProperty({ example: "Food" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

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
  @IsIban()
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

export class BankConnectionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: BankProvider })
  provider!: BankProvider;

  @ApiPropertyOptional({ nullable: true })
  label!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastSyncedAt!: Date | null;

  @ApiPropertyOptional()
  message?: string;
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

  @ApiProperty({ example: DEFAULT_CURRENCY, enum: CurrencyEnum })
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
