import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import * as bcrypt from "bcrypt";
import { USER_ERROR_MESSAGES } from "src/core/constants/user-errors.constants";
import { CreateUserDto, UserDto } from "src/core/dto/user.dto";
import { User } from "src/db/dbModels/User";
import { ProfileService } from "src/profile/profile.service";

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly profileService: ProfileService,
  ) {}

  toUserDto(user: User): UserDto {
    return user.toDto();
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException(USER_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hash = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);
    const user = await this.userModel.create({
      lastName: userData.lastName,
      firstName: userData.firstName,
      email: userData.email,
      password: hash,
    });

    await this.profileService.createForUser(user.id, {
      firstName: userData.firstName,
      lastName: userData.lastName,
    });

    return user;
  }

  async getAllUser(): Promise<UserDto[]> {
    const users = await this.userModel.findAll();
    return users.map((user) => user.toDto());
  }
}
