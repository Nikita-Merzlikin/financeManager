import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "src/core/dto/user.dto";
import { User } from "src/db/dbModels/User";
import * as bcrypt from "bcrypt";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class UserService {
<<<<<<< Updated upstream
  async createUser(dto: CreateUserDto) {
    const existingUser = await User.findOne({
=======
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
>>>>>>> Stashed changes
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }
<<<<<<< Updated upstream
    const hash = await bcrypt.hash(dto.password, 10);
    const newUser = await User.create({
      lastName: dto.lastName,
      firstName: dto.firstName,
      email: dto.email,
=======
    const hash = await bcrypt.hash(userData.password, 10);
    const newUser = await this.userModel.create({
      lastName: userData.lastName,
      firstName: userData.firstName,
      email: userData.email,
>>>>>>> Stashed changes
      password: hash,
    });

    return this.toUserDto(newUser);
  }

  async getAllUser(): Promise<UserDto[]> {
    const allUser = await this.userModel.findAll();
    return allUser.map((user) => this.toUserDto(user));
  }
}
