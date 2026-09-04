import { Injectable } from "@nestjs/common";
import { BankProvider } from "src/core/enums/finance.enums";
import type { Bank } from "./bank.interface";
import { MonobankBank } from "./monobank.bank";
import { PrivatBank } from "./privat.bank";

@Injectable()
export class BankFactory {
  private readonly banks: Map<BankProvider, Bank>;

  constructor(monobankBank: MonobankBank, privatBank: PrivatBank) {
    this.banks = new Map<BankProvider, Bank>([
      [BankProvider.MONOBANK, monobankBank],
      [BankProvider.PRIVAT, privatBank],
    ]);
  }

  get(provider: BankProvider): Bank {
    const bank = this.banks.get(provider);
    if (!bank) {
      throw new Error(`Unsupported bank provider: ${provider}`);
    }
    return bank;
  }
}
