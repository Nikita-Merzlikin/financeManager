import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from "@nestjs/common";
import { MulterError } from "multer";
import { PROFILE_ERROR_MESSAGES } from "src/core/constants/profile-errors.constants";

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, _host: ArgumentsHost) {
    if (exception.code === "LIMIT_FILE_SIZE") {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.AVATAR_TOO_LARGE);
    }

    throw new BadRequestException(exception.message);
  }
}
