import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
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

export class PrivacySettingsDto {
  @ApiProperty({
    enum: ProfileVisibilityEnum,
    example: DEFAULT_PROFILE_VISIBILITY,
  })
  profileVisibility!: ProfileVisibilityEnum;

  @ApiProperty({ example: DEFAULT_SHOW_EMAIL })
  showEmail!: boolean;

  @ApiProperty({ example: DEFAULT_SHOW_DATE_OF_BIRTH })
  showDateOfBirth!: boolean;

  @ApiProperty({ example: DEFAULT_SHOW_AVATAR })
  showAvatar!: boolean;

  @ApiProperty({ example: DEFAULT_ALLOW_ANALYTICS })
  allowAnalytics!: boolean;
}

export class PreferencesSettingsDto {
  @ApiProperty({ enum: LanguageEnum, example: LanguageEnum.UK })
  language!: LanguageEnum;

  @ApiProperty({ enum: CurrencyEnum, example: DEFAULT_CURRENCY })
  currency!: CurrencyEnum;

  @ApiProperty({ enum: UnitSystemEnum, example: UnitSystemEnum.METRIC })
  unitSystem!: UnitSystemEnum;
}

export class SettingsProfileDto {
  @ApiPropertyOptional({ example: "Pavlo", nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ example: "Beletskyi", nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({
    example:
      "avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890/550e8400-e29b-41d4-a716-446655440000.jpg",
    nullable: true,
  })
  avatar!: string | null;

  @ApiPropertyOptional({ example: "Finance enthusiast", nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ example: "1995-05-20", nullable: true })
  dateOfBirth!: string | null;
}

export class SettingsDto {
  @ApiProperty({
    description: "Settings id",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id!: string;

  @ApiProperty({ type: PrivacySettingsDto })
  privacy!: PrivacySettingsDto;

  @ApiProperty({ type: PreferencesSettingsDto })
  preferences!: PreferencesSettingsDto;

  @ApiProperty({ type: SettingsProfileDto })
  profile!: SettingsProfileDto;
}

export class UpdatePrivacySettingsDto {
  @ApiPropertyOptional({ enum: ProfileVisibilityEnum })
  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  profileVisibility?: ProfileVisibilityEnum;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showDateOfBirth?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showAvatar?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allowAnalytics?: boolean;
}

export class UpdatePreferencesSettingsDto {
  @ApiPropertyOptional({ enum: LanguageEnum, example: LanguageEnum.UK })
  @IsOptional()
  @IsEnum(LanguageEnum)
  language?: LanguageEnum;

  @ApiPropertyOptional({ enum: CurrencyEnum, example: DEFAULT_CURRENCY })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  currency?: CurrencyEnum;

  @ApiPropertyOptional({
    enum: UnitSystemEnum,
    example: UnitSystemEnum.METRIC,
  })
  @IsOptional()
  @IsEnum(UnitSystemEnum)
  unitSystem?: UnitSystemEnum;
}

export class UpdateSettingsProfileDto {
  @ApiPropertyOptional({ example: "Pavlo" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: "Beletskyi" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: "Finance enthusiast" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: "1995-05-20" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

/** Nested PATCH body aligned with GET /settings response shape. */
export class UpdateSettingsDto {
  @ApiPropertyOptional({ type: UpdatePrivacySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePrivacySettingsDto)
  privacy?: UpdatePrivacySettingsDto;

  @ApiPropertyOptional({ type: UpdatePreferencesSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePreferencesSettingsDto)
  preferences?: UpdatePreferencesSettingsDto;

  @ApiPropertyOptional({ type: UpdateSettingsProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSettingsProfileDto)
  profile?: UpdateSettingsProfileDto;
}
