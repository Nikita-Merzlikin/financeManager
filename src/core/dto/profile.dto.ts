import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProfileDto {
  @ApiProperty({
    description: "Profile id",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id!: string;

  @ApiPropertyOptional({ example: "Pavlo", nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ example: "Beletskyi", nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({
    example: "avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890/550e8400-e29b-41d4-a716-446655440000.jpg",
    nullable: true,
  })
  avatar!: string | null;

  @ApiPropertyOptional({ example: "Finance enthusiast", nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ example: "1995-05-20", nullable: true })
  dateOfBirth!: string | null;
}
