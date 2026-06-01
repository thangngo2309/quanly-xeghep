import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enums';

export type CurrentUserData = {
  userId: string;
  phone: string;
  role: UserRole;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);