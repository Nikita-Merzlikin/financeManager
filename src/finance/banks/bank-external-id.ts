import type { PrivatTransactionRow } from "./privat.client";

/**
 * Deterministic external id for upserts.
 * Random UUIDs are not used: re-sync would create duplicates.
 */
export function buildPrivatExternalId(
  row: PrivatTransactionRow,
  iban: string,
  amountMinor: bigint,
): string {
  if (row.ID != null && String(row.ID).length > 0) {
    return `privat:${row.ID}`;
  }
  const purpose = row.OSND || row.PURPOSE || "";
  return `privat:${iban}:${row.DAT_OD ?? ""}:${amountMinor.toString()}:${purpose}`;
}

export function buildMonobankExternalId(statementItemId: string): string {
  return `monobank:${statementItemId}`;
}

export function normalizeIban(iban: string): string {
  return iban.replace(/\s/g, "").toUpperCase();
}
