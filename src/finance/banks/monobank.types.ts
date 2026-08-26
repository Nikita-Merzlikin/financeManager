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
  balance?: number;
  comment?: string;
};

export type MonoWebhookPayload = {
  type?: string;
  data?: {
    account?: string;
    statementItem?: MonoStatementItem;
  };
};
