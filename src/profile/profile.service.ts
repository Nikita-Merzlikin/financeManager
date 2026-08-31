import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { randomUUID } from "crypto";
import { PROFILE_ERROR_MESSAGES } from "src/core/constants/profile-errors.constants";
import { ProfileDto } from "src/core/dto/profile.dto";
import { UpdateProfileDto } from "src/core/dto/update-profile.dto";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_MIME_TO_EXT,
  AvatarMimeTypeEnum,
  MAX_AVATAR_FILE_SIZE,
} from "src/core/enums/profile.enums";
import { UserProfile } from "src/db/dbModels/UserProfile";
import { S3Service } from "src/s3/s3.service";

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(UserProfile)
    private readonly userProfileModel: typeof UserProfile,
    private readonly s3Service: S3Service,
  ) {}

  toProfileDto(profile: UserProfile): ProfileDto {
    return profile.toDto();
  }

  async createForUser(
    userId: string,
    data?: { firstName?: string; lastName?: string },
  ): Promise<UserProfile> {
    const [profile] = await this.userProfileModel.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        firstName: data?.firstName ?? null,
        lastName: data?.lastName ?? null,
      },
    });
    return profile;
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const profile = await this.findByUserId(userId);
    return profile.toDto();
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const profile = await this.findByUserId(userId);

    try {
      await profile.update({ ...dto });
    } catch {
      throw new InternalServerErrorException(
        PROFILE_ERROR_MESSAGES.UPDATE_FAILED,
      );
    }

    return profile.toDto();
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ProfileDto> {
    this.validateAvatarFile(file);

    const profile = await this.findByUserId(userId);
    const previousAvatar = profile.avatar;

    const extension =
      AVATAR_MIME_TO_EXT[file.mimetype as AvatarMimeTypeEnum] || "jpg";
    const key = `avatars/${userId}/${randomUUID()}.${extension}`;

    await this.s3Service.upload(
      key,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    try {
      await profile.update({ avatar: key });
    } catch {
      await this.s3Service.delete(key).catch(() => undefined);
      throw new InternalServerErrorException(
        PROFILE_ERROR_MESSAGES.UPDATE_FAILED,
      );
    }

    if (previousAvatar && previousAvatar !== key) {
      await this.s3Service.delete(previousAvatar).catch(() => undefined);
    }

    return profile.toDto();
  }

  private async findByUserId(userId: string): Promise<UserProfile> {
    const profile = await this.userProfileModel.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }
    return profile;
  }

  private validateAvatarFile(file?: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.AVATAR_REQUIRED);
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        PROFILE_ERROR_MESSAGES.AVATAR_INVALID_TYPE,
      );
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.AVATAR_TOO_LARGE);
    }
  }
}
