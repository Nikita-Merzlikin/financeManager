import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ description: "First name", example: "Pavlo" })
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ description: "Last name", example: "Beletskyi" })
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    description: "Unique email address",
    example: "testemail123@gmail.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "ValidPassword1234",
    description: "Password must be at least 8 characters",
    minLength: 8,
  })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

export class UserDto {
  @ApiProperty({
    description: "User id",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id!: string;

  @ApiProperty({ example: "Pavlo" })
  firstName!: string;

  @ApiProperty({ example: "Beletskyi" })
  lastName!: string;

  @ApiProperty({ example: "testemail123@gmail.com" })
  email!: string;

  @ApiProperty({ example: "2026-07-28T12:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-28T12:00:00.000Z" })
  updatedAt!: Date;
}
