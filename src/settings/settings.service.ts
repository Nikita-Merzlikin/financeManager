import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { UniqueConstraintError } from "sequelize";
import { SETTINGS_ERROR_MESSAGES } from "src/core/constants/settings-errors.constants";
import type { ProfileDto } from "src/core/dto/profile.dto";
import type {
  SettingsDto,
  UpdatePreferencesSettingsDto,
  UpdatePrivacySettingsDto,
  UpdateSettingsDto,
} from "src/core/dto/settings.dto";
import type { UpdateProfileDto } from "src/core/dto/update-profile.dto";
import { CurrencyEnum, DEFAULT_CURRENCY } from "src/core/enums/finance.enums";
import { LanguageEnum, UnitSystemEnum } from "src/core/enums/header.enums";
import {
  DEFAULT_ALLOW_ANALYTICS,
  DEFAULT_PROFILE_VISIBILITY,
  DEFAULT_SHOW_AVATAR,
  DEFAULT_SHOW_DATE_OF_BIRTH,
  DEFAULT_SHOW_EMAIL,
} from "src/core/enums/settings.enums";
import type {
  PreferencesSettingsPatch,
  PrivacySettingsPatch,
} from "src/core/types/settings.types";
import { UserSettings } from "src/db/dbModels/UserSettings";
import { ProfileService } from "src/profile/profile.service";
import { toSettingsDto } from "./settings.presenter";

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(UserSettings)
    private readonly userSettingsModel: typeof UserSettings,
    private readonly profileService: ProfileService,
  ) {}

  async createForUser(userId: string): Promise<UserSettings> {
    try {
      const [settings] = await this.userSettingsModel.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          profileVisibility: DEFAULT_PROFILE_VISIBILITY,
          showEmail: DEFAULT_SHOW_EMAIL,
          showDateOfBirth: DEFAULT_SHOW_DATE_OF_BIRTH,
          showAvatar: DEFAULT_SHOW_AVATAR,
          allowAnalytics: DEFAULT_ALLOW_ANALYTICS,
          language: LanguageEnum.UK,
          currency: DEFAULT_CURRENCY,
          unitSystem: UnitSystemEnum.METRIC,
        },
      });
      return settings;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const existing = await this.userSettingsModel.findOne({
          where: { userId },
        });
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async getOrCreateForUser(userId: string): Promise<UserSettings> {
    return this.createForUser(userId);
  }

  async getPreferredCurrency(userId: string): Promise<CurrencyEnum> {
    const settings = await this.getOrCreateForUser(userId);
    return settings.currency;
  }

  async getSettings(userId: string): Promise<SettingsDto> {
    const [settings, profile] = await Promise.all([
      this.getOrCreateForUser(userId),
      this.profileService.getProfile(userId),
    ]);
    return toSettingsDto(settings, profile);
  }

  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<SettingsDto> {
    const settings = await this.getOrCreateForUser(userId);
    const settingsPatch: PrivacySettingsPatch & PreferencesSettingsPatch = {
      ...this.pickPrivacyPatch(dto.privacy),
      ...this.pickPreferencesPatch(dto.preferences),
    };

    if (Object.keys(settingsPatch).length > 0) {
      await this.persistSettingsPatch(settings, settingsPatch);
    }

    const profilePatch = this.extractProfilePatch(dto.profile);
    let profile: ProfileDto;
    if (Object.keys(profilePatch).length > 0) {
      profile = await this.profileService.updateProfile(userId, profilePatch);
    } else {
      profile = await this.profileService.getProfile(userId);
    }

    return toSettingsDto(settings, profile);
  }

  async updatePrivacy(
    userId: string,
    dto: UpdatePrivacySettingsDto,
  ): Promise<SettingsDto> {
    const settings = await this.getOrCreateForUser(userId);
    await this.persistSettingsPatch(settings, this.pickPrivacyPatch(dto));
    const profile = await this.profileService.getProfile(userId);
    return toSettingsDto(settings, profile);
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesSettingsDto,
  ): Promise<SettingsDto> {
    const settings = await this.getOrCreateForUser(userId);
    await this.persistSettingsPatch(settings, this.pickPreferencesPatch(dto));
    const profile = await this.profileService.getProfile(userId);
    return toSettingsDto(settings, profile);
  }

  private pickPrivacyPatch(
    patch?: PrivacySettingsPatch | null,
  ): PrivacySettingsPatch {
    if (!patch) {
      return {};
    }
    const payload: PrivacySettingsPatch = {};
    if (patch.profileVisibility !== undefined) {
      payload.profileVisibility = patch.profileVisibility;
    }
    if (patch.showEmail !== undefined) {
      payload.showEmail = patch.showEmail;
    }
    if (patch.showDateOfBirth !== undefined) {
      payload.showDateOfBirth = patch.showDateOfBirth;
    }
    if (patch.showAvatar !== undefined) {
      payload.showAvatar = patch.showAvatar;
    }
    if (patch.allowAnalytics !== undefined) {
      payload.allowAnalytics = patch.allowAnalytics;
    }
    return payload;
  }

  private pickPreferencesPatch(
    patch?: PreferencesSettingsPatch | null,
  ): PreferencesSettingsPatch {
    if (!patch) {
      return {};
    }
    const payload: PreferencesSettingsPatch = {};
    if (patch.language !== undefined) {
      payload.language = patch.language;
    }
    if (patch.currency !== undefined) {
      payload.currency = patch.currency;
    }
    if (patch.unitSystem !== undefined) {
      payload.unitSystem = patch.unitSystem;
    }
    return payload;
  }

  private async persistSettingsPatch(
    settings: UserSettings,
    patch: PrivacySettingsPatch & PreferencesSettingsPatch,
  ): Promise<void> {
    if (Object.keys(patch).length === 0) {
      return;
    }
    try {
      await settings.update(patch);
    } catch {
      throw new InternalServerErrorException(
        SETTINGS_ERROR_MESSAGES.UPDATE_FAILED,
      );
    }
  }

  private extractProfilePatch(
    profile?: UpdateSettingsDto["profile"],
  ): UpdateProfileDto {
    if (!profile) {
      return {};
    }
    const patch: UpdateProfileDto = {};
    if (profile.firstName !== undefined) {
      patch.firstName = profile.firstName;
    }
    if (profile.lastName !== undefined) {
      patch.lastName = profile.lastName;
    }
    if (profile.description !== undefined) {
      patch.description = profile.description;
    }
    if (profile.dateOfBirth !== undefined) {
      patch.dateOfBirth = profile.dateOfBirth;
    }
    return patch;
  }
}
