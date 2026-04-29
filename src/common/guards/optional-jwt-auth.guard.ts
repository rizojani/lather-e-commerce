import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err) {
      return null as TUser;
    }
    return (user ?? null) as TUser;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
