import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { UserService } from "./user.service";
import { CreateUserDto, UserDto } from "src/core/dto/user.dto";

@Controller("auth")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("register")
  @UseInterceptors(AnyFilesInterceptor())
  createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.userService.createUser(dto);
  }
}
