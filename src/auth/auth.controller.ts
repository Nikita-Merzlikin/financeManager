import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import { AuthTokensDto } from "src/core/dto/auth-tokens.dto";
import { CreateUserDto } from "src/core/dto/user.dto";
import { LoginDto } from "src/core/dto/login.dto";
import { MessageResponseDto } from "src/core/dto/message-response.dto";
import { RefreshTokenDto } from "src/core/dto/refresh-token.dto";
import { RegisterResponseDto } from "src/core/dto/register-response.dto";
import { AuthService } from "./auth.service";

@ApiTags("auth")
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
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register a new user",
    description:
      "Creates a new user, stores a session, and returns accessToken + refreshToken together with the user profile.",
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: "User registered and tokens issued",
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiConflictResponse({ description: "User with this email already exists" })
  register(
    @Body() dto: CreateUserDto,
    @Req() req: Request,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(dto, this.sessionMeta(req));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login with email and password",
    description:
      "Validates credentials and returns accessToken + refreshToken. Creates a row in sessions.",
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: "Tokens issued", type: AuthTokensDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({ description: "Invalid email or password" })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthTokensDto> {
    return this.authService.login(dto, this.sessionMeta(req));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh tokens",
    description:
      "Exchanges a valid refreshToken from sessions for a new accessToken and refreshToken pair.",
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: "Tokens refreshed", type: AuthTokensDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({
    description: "Invalid or expired refresh token",
  })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthTokensDto> {
    return this.authService.refresh(dto.refreshToken, this.sessionMeta(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Logout",
    description: "Deletes the session associated with the given refreshToken.",
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: "Logged out", type: MessageResponseDto })
  @ApiBadRequestResponse({ description: "Validation failed" })
  @ApiUnauthorizedResponse({ description: "Session not found" })
  logout(@Body() dto: RefreshTokenDto): Promise<MessageResponseDto> {
    return this.authService.logout(dto.refreshToken);
  }

  private sessionMeta(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };
  }
}
