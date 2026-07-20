import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { UserService } from "./user.service";
<<<<<<< Updated upstream
import { CreateUserDto } from "src/core/dto/user.dto";
=======
import { CreateUserDto, UserDto } from "src/core/dto/user.dto";
import { ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";
>>>>>>> Stashed changes

@ApiHeader({
  name: "x-unit-system",
  required: false,
  schema: {
    type: "string",
    enum: ["metric", "imperial"],
    default: "metric",
  },
})
@ApiHeader({
  name: "x-lang",
  required: false,
  schema: {
    type: "string",
    enum: ["en", "ru", "uk"],
    default: "uk",
  },
})
@ApiHeader({
  name: "client-type",
  required: false,
  schema: {
    type: "string",
    enum: ["admin", "client"],
    default: "client",
  },
})
@ApiHeader({
  name: "Currency",
  required: false,
  schema: {
    type: "string",
    enum: ["UAH", "USD", "EUR"],
    default: "UAH",
  },
})
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: "Used to  register user" })
  @ApiResponse({
    status: 201,
    description: "User was registered",
    type: UserDto,
  })
  @Post("register")
  @UseInterceptors(AnyFilesInterceptor())
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @ApiOperation({ summary: "Used to get all users" })
  @ApiResponse({
    status: 201,
    description: "All users were got",
    type: UserDto,
    isArray: true,
  })
  @Get("allUSer")
  getUSers() {
    return this.userService.getAllUser();
  }
}
