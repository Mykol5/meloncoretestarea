import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationRepository } from '../repository/organization.repository';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly organizationRepository: OrganizationRepository) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('🔐 JwtAuthGuard: Starting validation');

    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      console.log('❌ JwtAuthGuard: Passport validation failed');
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('✅ JwtAuthGuard: User from JWT:', user);

    if (!user.organizationId) {
      console.error('❌ JwtAuthGuard: No organizationId in JWT token');
      throw new UnauthorizedException('Invalid token: missing organization');
    }

    // Check if organization is active and not expired
    console.log(
      '🔍 JwtAuthGuard: Looking up organization:',
      user.organizationId,
    );

    const organization = await this.organizationRepository.findById(
      user.organizationId,
    );

    console.log(
      '📦 JwtAuthGuard: Organization found:',
      organization ? organization._id : 'NOT FOUND',
    );

    if (!organization) {
      console.error('❌ JwtAuthGuard: Organization not found in database');
      throw new UnauthorizedException('Organization not found');
    }

    console.log('📊 JwtAuthGuard: Organization status:', organization.status);

    // Check trial expiration
    if (
      organization.status === 'TRIAL' &&
      organization.trialEndsAt &&
      organization.trialEndsAt < new Date()
    ) {
      console.error('❌ JwtAuthGuard: Trial expired');
      throw new UnauthorizedException(
        'Trial period has expired. Please upgrade your plan.',
      );
    }

    if (
      organization.status === 'SUSPENDED' ||
      organization.status === 'EXPIRED'
    ) {
      console.error(
        '❌ JwtAuthGuard: Organization inactive:',
        organization.status,
      );
      throw new UnauthorizedException(
        'Organization account is not active. Please contact support.',
      );
    }

    console.log('✅ JwtAuthGuard: Validation successful');
    return true;
  }
}
