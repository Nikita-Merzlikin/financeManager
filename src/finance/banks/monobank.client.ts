import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { fromMinorUnits } from "../finance.utils";

export type MonoAccount = {
  id: string;
  balance: number;
  creditLimit: number;
  type: string;
  currencyCode: number;
  maskedPan?: string[];
  iban?: string;
};

export type MonoJar = {
  id: string;
  title: string;
  balance: number;
  goal?: number;
  currencyCode: number;
};

export type MonoClientInfo = {
  clientId: string;
  name: string;
  accounts: MonoAccount[];
  jars?: MonoJar[];
};

export type MonoStatementItem = {
  id: string;
  time: number;
  description: string;
  mcc: number;
  amount: number;
  currencyCode: number;
  balance: number;
  comment?: string;
};

@Injectable()
export class MonobankClient {
  private readonly logger = new Logger(MonobankClient.name);
  private readonly baseUrl = "https://api.monobank.ua";

  async getClientInfo(token: string): Promise<MonoClientInfo> {
    return this.request<MonoClientInfo>("/personal/client-info", token);
  }

  async getStatement(
    token: string,
    accountId: string,
    fromUnix: number,
    toUnix?: number,
  ): Promise<MonoStatementItem[]> {
    const to = toUnix ?? Math.floor(Date.now() / 1000);
    return this.request<MonoStatementItem[]>(
      `/personal/statement/${accountId}/${fromUnix}/${to}`,
      token,
    );
  }

  async setWebhook(token: string, webHookUrl: string): Promise<void> {
    await this.request("/personal/webhook", token, {
      method: "POST",
      body: JSON.stringify({ webHookUrl }),
    });
  }

  mapCurrency(code: number): string {
    if (code === 980) return "UAH";
    if (code === 840) return "USD";
    if (code === 978) return "EUR";
    return String(code);
  }

  toMajorAmount(minor: number): number {
    return fromMinorUnits(Math.abs(minor));
  }

  private async request<T>(
    path: string,
    token: string,
    init?: RequestInit,
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "X-Token": token,
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      if (response.status === 429) {
        throw new BadRequestException(
          "Monobank rate limit: retry after 60 seconds",
        );
      }

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Monobank ${path} failed: ${response.status}`);
        throw new BadRequestException(
          text || `Monobank request failed with status ${response.status}`,
        );
      }

      if (response.status === 200 && path === "/personal/webhook") {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      this.logger.error(`Monobank network error on ${path}`);
      throw new ServiceUnavailableException("Monobank is unavailable");
    }
  }
}
