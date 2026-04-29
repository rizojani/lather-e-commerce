import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const normalizedErrors = this.normalizeErrors(exceptionResponse);
    const primaryMessage = normalizedErrors[0] ?? 'Internal server error';

    response.status(status).json({
      success: false,
      message: primaryMessage,
      data: normalizedErrors,
    });
  }

  private normalizeErrors(exceptionResponse: unknown): string[] {
    if (typeof exceptionResponse === 'string') {
      return [exceptionResponse];
    }

    if (Array.isArray(exceptionResponse)) {
      return exceptionResponse.map((error) => String(error));
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseObject = exceptionResponse as { message?: unknown; error?: unknown };
      const { message, error } = responseObject;

      if (Array.isArray(message)) {
        return message.map((item) => String(item));
      }

      if (typeof message === 'string') {
        return [message];
      }

      if (Array.isArray(error)) {
        return error.map((item) => String(item));
      }

      if (typeof error === 'string') {
        return [error];
      }
    }

    return ['Internal server error'];
  }
}
