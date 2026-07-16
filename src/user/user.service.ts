import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "src/core/dto/user.dto";
import { User } from "src/db/dbModels/User";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  async createUser(dto: CreateUserDto) {
    const existingUser = await User.findOne({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const newUser = await User.create({
      lastName: dto.lastName,
      firstName: dto.firstName,
      email: dto.email,
      password: hash,
    });

    return newUser;
  }
}
