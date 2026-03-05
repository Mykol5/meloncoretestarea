import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRepository } from '../repository/users.repository';
import { UserRole } from 'src/libs/constants';

@Injectable()
export class OrganizationOwnerGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const dbUser = await this.userRepository.findById(user.sub);
    if (!dbUser || dbUser.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        'Only organization owners can perform this action',
      );
    }

    return true;
  }
}
