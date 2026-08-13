import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { randomUUID } from "crypto";
import { ProfileDto } from "src/core/dto/profile.dto";
import { UpdateProfileDto } from "src/core/dto/update-profile.dto";
import { UserProfile } from "src/db/dbModels/UserProfile";
import { S3Service } from "src/s3/s3.service";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(UserProfile)
    private readonly userProfileModel: typeof UserProfile,
    private readonly s3Service: S3Service,
  ) {}

  toProfileDto(profile: UserProfile): ProfileDto {
    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      description: profile.description,
      dateOfBirth: profile.dateOfBirth,
    };
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
    return this.toProfileDto(profile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const profile = await this.findByUserId(userId);

    try {
      await profile.update({
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
      });
    } catch {
      throw new InternalServerErrorException("Failed to update profile");
    }

    return this.toProfileDto(profile);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ProfileDto> {
    this.validateAvatarFile(file);

    const profile = await this.findByUserId(userId);
    const previousAvatar = profile.avatar;

    const extension = MIME_TO_EXT[file.mimetype];
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
      throw new InternalServerErrorException("Failed to update profile");
    }

    if (previousAvatar && previousAvatar !== key) {
      await this.s3Service.delete(previousAvatar).catch(() => undefined);
    }

    return this.toProfileDto(profile);
  }

  private async findByUserId(userId: string): Promise<UserProfile> {
    const profile = await this.userProfileModel.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  private validateAvatarFile(file?: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("Avatar file is required");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        "Invalid avatar file type. Allowed: jpg, jpeg, png, webp",
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        "Avatar file is too large. Maximum size is 5MB",
      );
    }
  }
}
