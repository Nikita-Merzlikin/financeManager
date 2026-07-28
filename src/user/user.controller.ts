import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserDto } from "src/core/dto/user.dto";
import { UserService } from "./user.service";

@ApiTags("user")
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

  @Get("allUSer")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Get all users",
    description: "Private endpoint. Requires Authorization: Bearer <accessToken>.",
  })
  @ApiOkResponse({
    description: "List of users",
    type: UserDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  getUSers(): Promise<UserDto[]> {
    return this.userService.getAllUser();
  }
}
