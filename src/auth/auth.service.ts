import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Op } from "sequelize";
import { AUTH_ERROR_MESSAGES } from "src/core/constants/auth-errors.constants";
import { AuthTokensDto } from "src/core/dto/auth-tokens.dto";
import { CreateUserDto } from "src/core/dto/user.dto";
import { LoginDto } from "src/core/dto/login.dto";
import { RegisterResponseDto } from "src/core/dto/register-response.dto";
import { SessionMeta } from "src/core/types/session-meta.type";
import { Session } from "src/db/dbModels/Session";
import { User } from "src/db/dbModels/User";
import { UserService } from "src/user/user.service";

const DEFAULT_JWT_ACCESS_EXPIRES_IN = "15m";
const DEFAULT_JWT_REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_BYTES_LENGTH = 48;

@Injectable()
export class AuthService {
  private readonly accessExpiresIn =
    process.env.JWT_ACCESS_EXPIRES_IN || DEFAULT_JWT_ACCESS_EXPIRES_IN;
  private readonly refreshExpiresMs = Number(
    process.env.JWT_REFRESH_EXPIRES_MS || DEFAULT_JWT_REFRESH_EXPIRES_MS,
  );

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Session)
    private readonly sessionModel: typeof Session,
  ) {}

  async register(
    dto: CreateUserDto,
    meta: SessionMeta,
  ): Promise<RegisterResponseDto> {
    const user = await this.userService.createUser(dto);
    const tokens = await this.createSessionTokens(user, meta);

    return {
      user: user.toDto(),
      ...tokens,
    };
  }

  async login(dto: LoginDto, meta: SessionMeta): Promise<AuthTokensDto> {
    const user = await this.userModel.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return this.createSessionTokens(user, meta);
  }

  async refresh(
    refreshToken: string,
    meta: SessionMeta,
  ): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionModel.findOne({
      where: {
        refreshToken: tokenHash,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        AUTH_ERROR_MESSAGES.INVALID_OR_EXPIRED_REFRESH_TOKEN,
      );
    }

    const user = await this.userModel.findByPk(session.userId);
    if (!user) {
      await session.destroy();
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await session.destroy();
    return this.createSessionTokens(user, meta);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(refreshToken);
    const deleted = await this.sessionModel.destroy({
      where: { refreshToken: tokenHash },
    });

    if (!deleted) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    return { message: AUTH_ERROR_MESSAGES.LOGGED_OUT };
  }

  private async createSessionTokens(
    user: User,
    meta: SessionMeta,
  ): Promise<AuthTokensDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: process.env.JWT_ACCESS_SECRET || "access-secret-change-me",
        expiresIn: this.accessExpiresIn as `${number}${"s" | "m" | "h" | "d"}`,
      },
    );

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES_LENGTH).toString("hex");
    const expiresAt = new Date(Date.now() + this.refreshExpiresMs);

    await this.sessionModel.create({
      userId: user.id,
      refreshToken: this.hashToken(refreshToken),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
