import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import dayjs from "dayjs";
import { FINANCE_ERROR_MESSAGES } from "src/core/constants/finance-errors.constants";
import { PRIVAT_API_URL, PRIVAT_PATHS } from "./privat.constants";
import type { PrivatBalanceRow, PrivatTransactionRow } from "./privat.types";

export type { PrivatBalanceRow, PrivatTransactionRow } from "./privat.types";

@Injectable()
export class PrivatClient {
  private readonly logger = new Logger(PrivatClient.name);
  private readonly baseUrl = PRIVAT_API_URL;

  async getBalance(
    clientId: string,
    token: string,
    iban: string,
    startDate?: string,
    endDate?: string,
  ): Promise<PrivatBalanceRow[]> {
    const start = startDate ?? this.formatDate(new Date());
    const end = endDate ?? start;
    const query = new URLSearchParams({
      acc: iban,
      startDate: start,
      endDate: end,
    });

    const data = await this.request<{ balances?: PrivatBalanceRow[] } | PrivatBalanceRow[]>(
      `${PRIVAT_PATHS.BALANCE}?${query.toString()}`,
      clientId,
      token,
    );
    if (Array.isArray(data)) return data;
    return data.balances ?? [];
  }

  async getTransactions(
    clientId: string,
    token: string,
    iban: string,
    startDate: string,
    endDate: string,
  ): Promise<PrivatTransactionRow[]> {
    const rows: PrivatTransactionRow[] = [];
    let followId: string | undefined;

    do {
      const query = new URLSearchParams({
        acc: iban,
        startDate,
        endDate,
      });
      if (followId) query.set("followId", followId);

      const data = await this.request<{
        transactions?: PrivatTransactionRow[];
        exist_next_page?: boolean | string;
        followId?: string;
        next_page_id?: string;
      }>(`${PRIVAT_PATHS.TRANSACTIONS}?${query.toString()}`, clientId, token);

      const chunk = data.transactions ?? [];
      rows.push(...chunk);

      const hasNext =
        data.exist_next_page === true || data.exist_next_page === "true";
      followId = hasNext
        ? data.followId || data.next_page_id || undefined
        : undefined;
    } while (followId);

    return rows;
  }

  formatDate(date: Date | string): string {
    return dayjs(date).format("DD-MM-YYYY");
  }

  private async request<T>(
    path: string,
    clientId: string,
    token: string,
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: {
          id: clientId,
          token,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Privat ${path} failed: ${response.status}`);
        throw new BadRequestException(
          text || `Privat request failed with status ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Privat network error on ${path}`);
      throw new ServiceUnavailableException(
        FINANCE_ERROR_MESSAGES.PRIVAT_API_UNAVAILABLE,
      );
    }
  }
}
