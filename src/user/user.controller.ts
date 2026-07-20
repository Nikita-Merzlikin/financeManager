import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { UserService } from "./user.service";
import { CreateUserDto, UserDto } from "src/core/dto/user.dto";
import { ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";

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

  @ApiOperation({ summary: "Used to register user" })
  @ApiResponse({
    status: 201,
    description: "User was registered",
    type: UserDto,
  })
  @Post("register")
  @UseInterceptors(AnyFilesInterceptor())
  createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.userService.createUser(dto);
  }

  @ApiOperation({ summary: "Used to get all users" })
  @ApiResponse({
    status: 200,
    description: "All users were got",
    type: UserDto,
    isArray: true,
  })
  @Get("allUSer")
  getUSers(): Promise<UserDto[]> {
    return this.userService.getAllUser();
  }
}
