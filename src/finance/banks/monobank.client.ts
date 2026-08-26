import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
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
    if (code === 980) return "UAH";
    if (code === 840) return "USD";
    if (code === 978) return "EUR";
    return String(code);
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
          "Monobank rate limit: retry after 60 seconds",
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
      throw new ServiceUnavailableException("Monobank is unavailable");
    }
  }
}
