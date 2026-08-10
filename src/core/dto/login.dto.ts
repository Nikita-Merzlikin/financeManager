import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "User email",
    example: "testemail123@gmail.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "User password (min 8 characters)",
    example: "ValidPassword1234",
    minLength: 8,
  })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
