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
