import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CreateUserDto, UserDto } from "src/core/dto/user.dto";
import { User } from "src/db/dbModels/User";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(userData: CreateUserDto): Promise<UserDto> {
    const existingUser = await this.userModel.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hash = await bcrypt.hash(userData.password, 10);
    const newUser = await this.userModel.create({
      lastName: userData.lastName,
      firstName: userData.firstName,
      email: userData.email,
      password: hash,
    });

    return this.toUserDto(newUser);
  }

  async getAllUser(): Promise<UserDto[]> {
    const allUser = await this.userModel.findAll();
    return allUser.map((user) => this.toUserDto(user));
  }
}
