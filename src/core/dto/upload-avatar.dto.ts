import { ApiProperty } from "@nestjs/swagger";

export class UploadAvatarDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Avatar image file (jpg, jpeg, png, webp)",
  })
  file!: Express.Multer.File;
}
