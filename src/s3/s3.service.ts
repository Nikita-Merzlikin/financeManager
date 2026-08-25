import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.AWS_REGION || "us-east-1";
    this.bucket = process.env.AWS_S3_BUCKET || "";

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
    originalFileName: string,
  ): Promise<string> {
    const safeFileName = originalFileName
      .replace(/"/g, "")
      .replace(/[^\x20-\x7E]/g, "_");
    const encodedFileName = encodeURIComponent(originalFileName.replace(/"/g, ""));

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentDisposition: `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
        }),
      );
      return key;
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException("Failed to upload file");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException("Failed to delete file");
    }
  }
}
