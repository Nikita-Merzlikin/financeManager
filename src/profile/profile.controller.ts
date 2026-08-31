import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ApiCommonHeaders } from "src/core/decorators/api-common-headers.decorator";
import { ProfileDto } from "src/core/dto/profile.dto";
import { UpdateProfileDto } from "src/core/dto/update-profile.dto";
import { UploadAvatarDto } from "src/core/dto/upload-avatar.dto";
import { MAX_AVATAR_FILE_SIZE } from "src/core/enums/profile.enums";
import type { JwtPayload } from "src/core/types/jwt-payload.type";
import { MulterExceptionFilter } from "./multer-exception.filter";
import { ProfileService } from "./profile.service";

@ApiTags("profile")
@ApiCommonHeaders()
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@UseFilters(MulterExceptionFilter)
@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: "Get current user profile",
    description:
      "Returns the profile of the authenticated user. Requires Authorization: Bearer <accessToken>.",
  })
  @ApiOkResponse({ description: "Current user profile", type: ProfileDto })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  @ApiNotFoundResponse({ description: "Profile not found" })
  getProfile(@CurrentUser() user: JwtPayload): Promise<ProfileDto> {
    return this.profileService.getProfile(user.sub);
  }

  @Patch()
  @ApiOperation({
    summary: "Update current user profile",
    description:
      "Partially updates the profile of the authenticated user. Requires Authorization: Bearer <accessToken>.",
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ description: "Updated profile", type: ProfileDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  @ApiNotFoundResponse({ description: "Profile not found" })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.profileService.updateProfile(user.sub, dto);
  }

  @Patch("avatar")
  @ApiOperation({
    summary: "Upload avatar",
    description:
      "Uploads an avatar image for the authenticated user to S3. Allowed types: jpg, jpeg, png, webp. Max size: 5MB.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadAvatarDto })
  @ApiOkResponse({ description: "Profile with updated avatar", type: ProfileDto })
  @ApiBadRequestResponse({
    description: "Invalid or oversized avatar file",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  @ApiNotFoundResponse({ description: "Profile not found" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_FILE_SIZE },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProfileDto> {
    return this.profileService.uploadAvatar(user.sub, file);
  }
}
