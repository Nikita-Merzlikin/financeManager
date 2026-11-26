import type { CurrencyEnum } from "src/core/enums/finance.enums";
import type { LanguageEnum, UnitSystemEnum } from "src/core/enums/header.enums";
import type { ProfileVisibilityEnum } from "src/core/enums/settings.enums";

export type PrivacySettingsFields = {
  profileVisibility: ProfileVisibilityEnum;
  showEmail: boolean;
  showDateOfBirth: boolean;
  showAvatar: boolean;
  allowAnalytics: boolean;
};

export type PreferencesSettingsFields = {
  language: LanguageEnum;
  currency: CurrencyEnum;
  unitSystem: UnitSystemEnum;
};

export type SettingsDefaults = PrivacySettingsFields &
  PreferencesSettingsFields;

export type PrivacySettingsPatch = Partial<PrivacySettingsFields>;
export type PreferencesSettingsPatch = Partial<PreferencesSettingsFields>;
