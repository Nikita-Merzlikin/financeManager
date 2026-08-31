import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ApiCommonHeaders } from "src/core/decorators/api-common-headers.decorator";
import { UserDto } from "src/core/dto/user.dto";
import { UserService } from "./user.service";

@ApiTags("user")
@ApiCommonHeaders()
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("allUSer")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Get all users",
    description:
      "Private endpoint. Requires Authorization: Bearer <accessToken>.",
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
