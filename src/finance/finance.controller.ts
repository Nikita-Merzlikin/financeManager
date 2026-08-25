import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import {
  AccountDto,
  CategoryDto,
  ConnectMonobankDto,
  ConnectPrivatDto,
  CreateAccountDto,
  CreateCategoryDto,
  CreateTransactionDto,
  DashboardDto,
  SyncBankDto,
  TransactionDto,
  UpdateAccountDto,
  UpdateTransactionDto,
} from "src/core/dto/finance.dto";
import { MessageResponseDto } from "src/core/dto/message-response.dto";
import type { JwtPayload } from "src/core/types/jwt-payload.type";
import { AccountsService } from "./accounts.service";
import { BanksService } from "./banks.service";
import { CategoriesService } from "./categories.service";
import { DashboardService } from "./dashboard.service";
import { TransactionsService } from "./transactions.service";

@ApiTags("finance")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller()
export class FinanceController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService,
    private readonly banksService: BanksService,
  ) {}

  @Get("dashboard")
  @ApiOperation({
    summary: "Home dashboard",
    description:
      "Returns total balance, income, expenses, savings, chart series and accounts for the current user.",
  })
  @ApiOkResponse({ type: DashboardDto })
  getDashboard(
    @CurrentUser() user: JwtPayload,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ): Promise<DashboardDto> {
    return this.dashboardService.getDashboard(user.sub, from, to);
  }

  @Get("accounts")
  @ApiOkResponse({ type: AccountDto, isArray: true })
  listAccounts(@CurrentUser() user: JwtPayload): Promise<AccountDto[]> {
    return this.accountsService.list(user.sub);
  }

  @Post("accounts")
  @ApiBody({ type: CreateAccountDto })
  @ApiOkResponse({ type: AccountDto })
  createAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountDto> {
    return this.accountsService.create(user.sub, dto);
  }

  @Patch("accounts/:id")
  @ApiBody({ type: UpdateAccountDto })
  @ApiOkResponse({ type: AccountDto })
  updateAccount(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountDto> {
    return this.accountsService.update(user.sub, id, dto);
  }

  @Delete("accounts/:id")
  @ApiOkResponse({ type: MessageResponseDto })
  deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<MessageResponseDto> {
    return this.accountsService.remove(user.sub, id);
  }

  @Get("transactions")
  @ApiOkResponse({ type: TransactionDto, isArray: true })
  listTransactions(
    @CurrentUser() user: JwtPayload,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ): Promise<TransactionDto[]> {
    return this.transactionsService.list(user.sub, from, to);
  }

  @Post("transactions")
  @ApiBody({ type: CreateTransactionDto })
  @ApiOkResponse({ type: TransactionDto })
  createTransaction(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionsService.create(user.sub, dto);
  }

  @Patch("transactions/:id")
  @ApiBody({ type: UpdateTransactionDto })
  @ApiOkResponse({ type: TransactionDto })
  updateTransaction(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionsService.update(user.sub, id, dto);
  }

  @Delete("transactions/:id")
  @ApiOkResponse({ type: MessageResponseDto })
  deleteTransaction(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<MessageResponseDto> {
    return this.transactionsService.remove(user.sub, id);
  }

  @Get("categories")
  @ApiOkResponse({ type: CategoryDto, isArray: true })
  listCategories(@CurrentUser() user: JwtPayload): Promise<CategoryDto[]> {
    return this.categoriesService.list(user.sub);
  }

  @Post("categories")
  @ApiBody({ type: CreateCategoryDto })
  @ApiOkResponse({ type: CategoryDto })
  createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoriesService.create(user.sub, dto);
  }

  @Get("banks/connections")
  listBankConnections(@CurrentUser() user: JwtPayload) {
    return this.banksService.listConnections(user.sub);
  }

  @Post("banks/monobank/connect")
  @ApiBody({ type: ConnectMonobankDto })
  @ApiOperation({
    summary: "Connect Monobank",
    description:
      "Save personal X-Token from https://api.monobank.ua and sync accounts/transactions.",
  })
  connectMonobank(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectMonobankDto,
  ) {
    return this.banksService.connectMonobank(user.sub, dto);
  }

  @Post("banks/privat/connect")
  @ApiBody({ type: ConnectPrivatDto })
  @ApiOperation({
    summary: "Connect PrivatBank FOP (AutoClient)",
    description:
      "Connect Privat24 Business AutoClient credentials and sync FOP IBAN.",
  })
  connectPrivat(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectPrivatDto,
  ) {
    return this.banksService.connectPrivat(user.sub, dto);
  }

  @Post("banks/connections/:id/sync")
  @ApiBody({ type: SyncBankDto })
  syncBank(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: SyncBankDto,
  ) {
    return this.banksService.sync(user.sub, id, dto);
  }

  @Delete("banks/connections/:id")
  disconnectBank(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<MessageResponseDto> {
    return this.banksService.disconnect(user.sub, id);
  }
}
