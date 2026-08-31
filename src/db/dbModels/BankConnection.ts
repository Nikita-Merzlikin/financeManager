import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { BankConnectionResponseDto } from "src/core/dto/finance.dto";
import { BankProvider } from "src/core/enums/finance.enums";
import { EncryptedColumn } from "../decorators/encrypted-column.decorator";
import { User } from "./User";

@Table({
  tableName: "BankConnections",
  timestamps: true,
})
export class BankConnection extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(BankProvider)),
    allowNull: false,
  })
  declare provider: BankProvider;

  /**
   * Pass a plain object or JSON string when writing; value is encrypted in DB.
   * Reading returns decrypted plaintext (JSON string).
   */
  @EncryptedColumn({ allowNull: false })
  declare credentialsEncrypted: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare label: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastSyncedAt: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;

  toDto(message?: string): BankConnectionResponseDto {
    return {
      id: this.id,
      provider: this.provider,
      label: this.label,
      lastSyncedAt: this.lastSyncedAt,
      ...(message && { message }),
    };
  }
}
