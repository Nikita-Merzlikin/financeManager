import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";

export type PrivatBalanceRow = {
  ACC?: string;
  balance?: string | number;
  BALANCEOUT?: string | number;
  BALANCEIN?: string | number;
  currency?: string;
  CCY?: string;
};

export type PrivatTransactionRow = {
  ID?: string;
  DAT_OD?: string;
  SUM?: string | number;
  AMOUNT?: string | number;
  TRANTYPE?: string;
  OSND?: string;
  PURPOSE?: string;
  CCY?: string;
  currency?: string;
};

@Injectable()
export class PrivatClient {
  private readonly logger = new Logger(PrivatClient.name);
  private readonly baseUrl =
    process.env.PRIVAT_AUTOCLIENT_BASE_URL || "https://acp.privatbank.ua/api";

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
      `/statements/balance?${query.toString()}`,
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
      }>(`/statements/transactions?${query.toString()}`, clientId, token);

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

  formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
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
      throw new ServiceUnavailableException("PrivatBank API is unavailable");
    }
  }
}
