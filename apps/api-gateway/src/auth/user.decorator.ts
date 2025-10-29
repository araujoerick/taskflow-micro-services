import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './jwt.strategy';

export const User = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): string | number | JwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
