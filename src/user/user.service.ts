import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto, UserDto } from "src/core/dto/user.dto";
import { User } from "src/db/dbModels/User";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  async createUser(userData: CreateUserDto): Promise<UserDto> {
    const existingUser = await User.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }
    const hash = await bcrypt.hash(userData.password, 10);
    const newUser = await User.create({
      lastName: userData.lastName,
      firstName: userData.firstName,
      email: userData.email,
      password: hash,
    });

    return newUser;
  }
}
