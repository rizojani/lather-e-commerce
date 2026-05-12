import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

/**
 * Wraps every successful response in `{ success, message, data }`.
 * Message resolution order:
 *   1. `@ResponseMessage('...')` decorator on the route handler / class.
 *   2. Existing `message` key inside the controller's returned `{ message, data }` payload.
 *   3. Fallback `'Request successful'`.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, { success: boolean; message: string; data: unknown }>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: boolean; message: string; data: unknown }> {
    const decoratorMessage = this.reflector.getAllAndOverride<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'message' in (data as Record<string, unknown>) &&
          'data' in (data as Record<string, unknown>)
        ) {
          const responseData = data as { message?: unknown; data?: unknown };
          const payloadMessage =
            typeof responseData.message === 'string' ? responseData.message : undefined;
          return {
            success: true,
            message: decoratorMessage ?? payloadMessage ?? 'Request successful',
            data: responseData.data ?? null,
          };
        }

        return {
          success: true,
          message: decoratorMessage ?? 'Request successful',
          data,
        };
      }),
    );
  }
}
