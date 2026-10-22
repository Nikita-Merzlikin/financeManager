import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { CurrencyEnum, DEFAULT_CURRENCY } from "src/core/enums/finance.enums";
import { LanguageEnum, UnitSystemEnum } from "src/core/enums/header.enums";
import {
  DEFAULT_ALLOW_ANALYTICS,
  DEFAULT_PROFILE_VISIBILITY,
  DEFAULT_SHOW_AVATAR,
  DEFAULT_SHOW_DATE_OF_BIRTH,
  DEFAULT_SHOW_EMAIL,
  ProfileVisibilityEnum,
} from "src/core/enums/settings.enums";
import type {
  PreferencesSettingsFields,
  PrivacySettingsFields,
} from "src/core/types/settings.types";
import { User } from "./User";

@Table({
  tableName: "UserSettings",
  timestamps: true,
})
export class UserSettings extends Model {
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
    unique: true,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(ProfileVisibilityEnum)),
    allowNull: false,
    defaultValue: DEFAULT_PROFILE_VISIBILITY,
  })
  declare profileVisibility: ProfileVisibilityEnum;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: DEFAULT_SHOW_EMAIL,
  })
  declare showEmail: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: DEFAULT_SHOW_DATE_OF_BIRTH,
  })
  declare showDateOfBirth: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: DEFAULT_SHOW_AVATAR,
  })
  declare showAvatar: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: DEFAULT_ALLOW_ANALYTICS,
  })
  declare allowAnalytics: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(LanguageEnum)),
    allowNull: false,
    defaultValue: LanguageEnum.UK,
  })
  declare language: LanguageEnum;

  @Column({
    type: DataType.ENUM(...Object.values(CurrencyEnum)),
    allowNull: false,
    defaultValue: DEFAULT_CURRENCY,
  })
  declare currency: CurrencyEnum;

  @Column({
    type: DataType.ENUM(...Object.values(UnitSystemEnum)),
    allowNull: false,
    defaultValue: UnitSystemEnum.METRIC,
  })
  declare unitSystem: UnitSystemEnum;

  declare createdAt: Date;
  declare updatedAt: Date;

  toPrivacyFields(): PrivacySettingsFields {
    return {
      profileVisibility: this.profileVisibility,
      showEmail: this.showEmail,
      showDateOfBirth: this.showDateOfBirth,
      showAvatar: this.showAvatar,
      allowAnalytics: this.allowAnalytics,
    };
  }

  toPreferencesFields(): PreferencesSettingsFields {
    return {
      language: this.language,
      currency: this.currency,
      unitSystem: this.unitSystem,
    };
  }
}
