import { Column } from "sequelize-typescript";
import { DataType, Model } from "sequelize-typescript";
import {
  decryptToPlaintext,
  encryptPlaintext,
} from "src/finance/finance.utils";

type EncryptedColumnOptions = {
  allowNull?: boolean;
  unique?: boolean;
  field?: string;
};

/**
 * Stores plaintext (string or JSON-serializable object) encrypted in DB.
 * Getter returns decrypted plaintext string.
 */
export function EncryptedColumn(
  options: EncryptedColumnOptions = {},
): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey.toString();

    Column({
      type: DataType.TEXT,
      ...options,
      get(this: Model) {
        const raw = this.getDataValue(key) as string | null | undefined;
        if (raw == null || raw === "") return raw;
        return decryptToPlaintext(raw);
      },
      set(this: Model, value: unknown) {
        if (value == null || value === "") {
          this.setDataValue(key, value as never);
          return;
        }
        const plain =
          typeof value === "string" ? value : JSON.stringify(value);
        this.setDataValue(key, encryptPlaintext(plain));
      },
    })(target, propertyKey);
  };
}
