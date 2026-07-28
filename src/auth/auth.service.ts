import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Op } from "sequelize";
import { AuthTokensDto } from "src/core/dto/auth-tokens.dto";
import { CreateUserDto } from "src/core/dto/user.dto";
import { LoginDto } from "src/core/dto/login.dto";
import { RegisterResponseDto } from "src/core/dto/register-response.dto";
import { Session } from "src/db/dbModels/Session";
import { User } from "src/db/dbModels/User";
import { UserService } from "src/user/user.service";

type SessionMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private readonly accessExpiresIn =
    process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  private readonly refreshExpiresMs = Number(
    process.env.JWT_REFRESH_EXPIRES_MS || 7 * 24 * 60 * 60 * 1000,
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
      user: this.userService.toUserDto(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto, meta: SessionMeta): Promise<AuthTokensDto> {
    const user = await this.userModel.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid email or password");
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
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.userModel.findByPk(session.userId);
    if (!user) {
      await session.destroy();
      throw new UnauthorizedException("User not found");
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
      throw new UnauthorizedException("Session not found");
    }

    return { message: "Logged out successfully" };
  }

  private async createSessionTokens(
    user: User,
    meta: SessionMeta,
  ): Promise<AuthTokensDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: String(user.id), email: user.email },
      {
        secret: process.env.JWT_ACCESS_SECRET || "access-secret-change-me",
        expiresIn: this.accessExpiresIn as `${number}${"s" | "m" | "h" | "d"}`,
      },
    );

    const refreshToken = randomBytes(48).toString("hex");
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
