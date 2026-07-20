import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "Pavlo" })
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: "Beletskyi" })
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: "testemail123@gmail.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "ValidPassword1234",
    description: "Password must be more than 8",
  })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
<<<<<<< Updated upstream
=======

export class UserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
>>>>>>> Stashed changes
