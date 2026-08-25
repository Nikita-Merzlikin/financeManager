import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const secret =
    process.env.BANK_CREDENTIALS_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    "bank-credentials-secret-change-me";
  return createHash("sha256").update(secret).digest();
}

export function encryptCredentials(payload: object): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(json, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptCredentials<T extends object>(value: string): T {
  const [ivHex, tagHex, dataHex] = value.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid credentials payload");
  }
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}

export function toMoney(value: number | string): number {
  return Math.round(Number(value) * 100) / 100;
}

export function fromMinorUnits(amount: number): number {
  return toMoney(amount / 100);
}

export function formatMoney(value: number | string): string {
  return toMoney(value).toFixed(2);
}
