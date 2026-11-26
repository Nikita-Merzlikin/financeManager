import { CurrencyEnum } from "src/core/enums/finance.enums";
import { LanguageEnum, UnitSystemEnum } from "src/core/enums/header.enums";
import { ProfileVisibilityEnum } from "src/core/enums/settings.enums";
import type { ProfileDto } from "src/core/dto/profile.dto";
import type { UserSettings } from "src/db/dbModels/UserSettings";
import { toSettingsDto } from "./settings.presenter";

describe("toSettingsDto", () => {
  it("maps settings and profile into SettingsDto", () => {
    const settings = {
      id: "settings-id",
      toPrivacyFields: () => ({
        profileVisibility: ProfileVisibilityEnum.PRIVATE,
        showEmail: false,
        showDateOfBirth: false,
        showAvatar: true,
        allowAnalytics: true,
      }),
      toPreferencesFields: () => ({
        language: LanguageEnum.UK,
        currency: CurrencyEnum.UAH,
        unitSystem: UnitSystemEnum.METRIC,
      }),
    } as unknown as UserSettings;

    const profile: ProfileDto = {
      id: "profile-id",
      firstName: "Pavlo",
      lastName: "Beletskyi",
      avatar: "avatars/u/a.jpg",
      description: "desc",
      dateOfBirth: "1995-05-20",
    };

    expect(toSettingsDto(settings, profile)).toEqual({
      id: "settings-id",
      privacy: {
        profileVisibility: ProfileVisibilityEnum.PRIVATE,
        showEmail: false,
        showDateOfBirth: false,
        showAvatar: true,
        allowAnalytics: true,
      },
      preferences: {
        language: LanguageEnum.UK,
        currency: CurrencyEnum.UAH,
        unitSystem: UnitSystemEnum.METRIC,
      },
      profile: {
        firstName: "Pavlo",
        lastName: "Beletskyi",
        avatar: "avatars/u/a.jpg",
        description: "desc",
        dateOfBirth: "1995-05-20",
      },
    });
  });
});
