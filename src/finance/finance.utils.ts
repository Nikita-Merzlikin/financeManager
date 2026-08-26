import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import Decimal from "decimal.js";

const ALGO = "aes-256-gcm";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

function getKey(): Buffer {
  const secret =
    process.env.BANK_CREDENTIALS_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    "bank-credentials-secret-change-me";
  return createHash("sha256").update(secret).digest();
}

export function encryptPlaintext(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToPlaintext(value: string): string {
  const [ivHex, tagHex, dataHex] = value.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted payload");
  }
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** @deprecated Prefer EncryptedColumn setter with a plain object */
export function encryptCredentials(payload: object): string {
  return encryptPlaintext(JSON.stringify(payload));
}

/** Parse credentials plaintext (already decrypted by EncryptedColumn getter). */
export function parseCredentials<T extends object>(plaintext: string): T {
  return JSON.parse(plaintext) as T;
}

/** @deprecated Prefer parseCredentials after EncryptedColumn getter */
export function decryptCredentials<T extends object>(value: string): T {
  if (value.includes(":") && value.split(":").length === 3) {
    try {
      return JSON.parse(decryptToPlaintext(value)) as T;
    } catch {
      // already plaintext JSON
    }
  }
  return JSON.parse(value) as T;
}

export type MoneyInput = number | string | Decimal;

/**
 * Convert major currency units (e.g. 12.34 UAH) to minor units (cents).
 * Use only at API/bank boundaries — keep bigint for storage and math.
 */
export function toMinorUnits(major: MoneyInput): bigint {
  return BigInt(new Decimal(major).times(100).toFixed(0));
}

/**
 * Parse a DB BIGINT / string / number as minor units.
 */
export function parseMinorUnits(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  const normalized = value.includes(".") ? value.split(".")[0] : value;
  return BigInt(normalized || "0");
}

/**
 * Convert minor units to major units for API responses only.
 */
export function fromMinorUnits(minor: string | number | bigint): number {
  return new Decimal(minor.toString()).div(100).toNumber();
}

export function addMinor(
  a: string | number | bigint,
  b: string | number | bigint,
): bigint {
  return parseMinorUnits(a) + parseMinorUnits(b);
}

export function subMinor(
  a: string | number | bigint,
  b: string | number | bigint,
): bigint {
  return parseMinorUnits(a) - parseMinorUnits(b);
}

/** Persist bigint minor units as string for Sequelize BIGINT columns. */
export function formatMinorUnits(value: bigint): string {
  return value.toString();
}
