import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ApiCommonHeaders } from "src/core/decorators/api-common-headers.decorator";
import {
  SettingsDto,
  UpdatePreferencesSettingsDto,
  UpdatePrivacySettingsDto,
  UpdateSettingsDto,
} from "src/core/dto/settings.dto";
import type { JwtPayload } from "src/core/types/jwt-payload.type";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@ApiCommonHeaders()
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: "Get current user settings",
    description:
      "Returns privacy, preferences, and profile summary for the authenticated user. Privacy flags are stored preferences only until a public-profile API enforces them. Avatar changes stay on /profile/avatar.",
  })
  @ApiOkResponse({ description: "Current user settings", type: SettingsDto })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  getSettings(@CurrentUser() user: JwtPayload): Promise<SettingsDto> {
    return this.settingsService.getSettings(user.sub);
  }

  @Patch()
  @ApiOperation({
    summary: "Update current user settings",
    description:
      "Partially updates nested privacy, preferences, and/or profile fields in one transaction.",
  })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiOkResponse({ description: "Updated settings", type: SettingsDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  @ApiNotFoundResponse({ description: "Profile not found" })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ): Promise<SettingsDto> {
    return this.settingsService.updateSettings(user.sub, dto);
  }

  @Patch("privacy")
  @ApiOperation({
    summary: "Update privacy settings",
    description:
      "Partially updates privacy flags. Not enforced on other endpoints yet.",
  })
  @ApiBody({ type: UpdatePrivacySettingsDto })
  @ApiOkResponse({ description: "Updated settings", type: SettingsDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  updatePrivacy(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePrivacySettingsDto,
  ): Promise<SettingsDto> {
    return this.settingsService.updatePrivacy(user.sub, dto);
  }

  @Patch("preferences")
  @ApiOperation({
    summary: "Update preference settings",
    description:
      "Partially updates language, currency, and unit system. Currency feeds dashboard and financial-plan defaults.",
  })
  @ApiBody({ type: UpdatePreferencesSettingsDto })
  @ApiOkResponse({ description: "Updated settings", type: SettingsDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesSettingsDto,
  ): Promise<SettingsDto> {
    return this.settingsService.updatePreferences(user.sub, dto);
  }
}
