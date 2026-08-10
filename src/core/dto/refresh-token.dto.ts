import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token received from login or previous refresh",
    example: "a1b2c3d4e5f6789012345678901234567890abcdef",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
