import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { FINANCE_ERROR_MESSAGES } from "src/core/constants/finance-errors.constants";
import {
  CurrencyEnum,
  IsoCurrencyCodeEnum,
} from "src/core/enums/finance.enums";
import { MONO_ENDPOINTS } from "./monobank.constants";
import type {
  MonoClientInfo,
  MonoStatementItem,
} from "./monobank.types";

export type {
  MonoAccount,
  MonoJar,
  MonoClientInfo,
  MonoStatementItem,
} from "./monobank.types";

@Injectable()
export class MonobankClient {
  private readonly logger = new Logger(MonobankClient.name);

  async getClientInfo(token: string): Promise<MonoClientInfo> {
    return this.request<MonoClientInfo>(MONO_ENDPOINTS.CLIENT_INFO, token);
  }

  async getStatement(
    token: string,
    accountId: string,
    fromUnix: number,
    toUnix?: number,
  ): Promise<MonoStatementItem[]> {
    const to = toUnix ?? Math.floor(Date.now() / 1000);
    return this.request<MonoStatementItem[]>(
      `${MONO_ENDPOINTS.STATEMENT}/${accountId}/${fromUnix}/${to}`,
      token,
    );
  }

  async setWebhook(token: string, webHookUrl: string): Promise<void> {
    await this.request(MONO_ENDPOINTS.WEBHOOK, token, {
      method: "POST",
      body: JSON.stringify({ webHookUrl }),
    });
  }

  mapCurrency(code: number): string {
    switch (code) {
      case IsoCurrencyCodeEnum.UAH:
        return CurrencyEnum.UAH;
      case IsoCurrencyCodeEnum.USD:
        return CurrencyEnum.USD;
      case IsoCurrencyCodeEnum.EUR:
        return CurrencyEnum.EUR;
      default:
        return String(code);
    }
  }

  toMinorAmount(minor: number): bigint {
    return BigInt(Math.abs(Math.trunc(minor)));
  }

  private async request<T>(
    url: string,
    token: string,
    init?: RequestInit,
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "X-Token": token,
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      if (response.status === 429) {
        throw new BadRequestException(
          FINANCE_ERROR_MESSAGES.MONOBANK_RATE_LIMIT,
        );
      }

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Monobank ${url} failed: ${response.status}`);
        throw new BadRequestException(
          text || `Monobank request failed with status ${response.status}`,
        );
      }

      if (response.status === 200 && url === MONO_ENDPOINTS.WEBHOOK) {
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
      this.logger.error(`Monobank network error on ${url}`);
      throw new ServiceUnavailableException(
        FINANCE_ERROR_MESSAGES.MONOBANK_API_UNAVAILABLE,
      );
    }
  }
}
