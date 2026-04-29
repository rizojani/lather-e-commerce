import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, { success: boolean; message: string; data: unknown }>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: boolean; message: string; data: unknown }> {
    return next.handle().pipe(
      map((data) => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'message' in (data as Record<string, unknown>) &&
          'data' in (data as Record<string, unknown>)
        ) {
          const responseData = data as { message?: unknown; data?: unknown };
          return {
            success: true,
            message:
              typeof responseData.message === 'string'
                ? responseData.message
                : 'Request successful',
            data: responseData.data ?? null,
          };
        }

        return {
          success: true,
          message: 'Request successful',
          data,
        };
      }),
    );
  }
}
