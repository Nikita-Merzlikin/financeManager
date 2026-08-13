import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from "@nestjs/common";
import { MulterError } from "multer";

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, _host: ArgumentsHost) {
    if (exception.code === "LIMIT_FILE_SIZE") {
      throw new BadRequestException(
        "Avatar file is too large. Maximum size is 5MB",
      );
    }

    throw new BadRequestException(exception.message);
  }
}
