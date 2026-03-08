import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = user?.role;

    if (!userRole) {
      throw new ForbiddenException('User role not found');
    }

    // Admin has access to everything
    if (userRole === Role.ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(userRole as Role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
