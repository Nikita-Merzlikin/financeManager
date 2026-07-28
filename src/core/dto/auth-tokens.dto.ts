import { ApiProperty } from "@nestjs/swagger";

export class AuthTokensDto {
  @ApiProperty({
    description: "JWT access token",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGdtYWlsLmNvbSJ9.abc",
  })
  accessToken!: string;

  @ApiProperty({
    description: "Refresh token for session renewal",
    example: "a1b2c3d4e5f6789012345678901234567890abcdef",
  })
  refreshToken!: string;
}
