import type { ProfileDto } from "src/core/dto/profile.dto";
import type { SettingsDto } from "src/core/dto/settings.dto";
import type { UserSettings } from "src/db/dbModels/UserSettings";

/** Maps settings + profile into the settings API response. */
export function toSettingsDto(
  settings: UserSettings,
  profile: ProfileDto,
): SettingsDto {
  return {
    id: settings.id,
    privacy: settings.toPrivacyFields(),
    preferences: settings.toPreferencesFields(),
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      description: profile.description,
      dateOfBirth: profile.dateOfBirth,
    },
  };
}
