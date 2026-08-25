import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Pavlo" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: "Beletskyi" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: "Finance enthusiast" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: "1995-05-20" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
