import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationRepository } from '../repository/organization.repository';
import { UserRepository } from '../repository/users.repository';
import { PlanType } from 'src/libs/constants';
import { UserRole } from 'src/libs/constants';
import { getPlanConfig } from '../../billing/enums/plan.enum';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getOrganizationDetails(organizationId: string, userId: string) {
    // Verify user belongs to organization
    const user = await this.userRepository.findOne({
      _id: userId,
      organization: organizationId,
    });

    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    const organization = await this.organizationRepository.findById(
      organizationId,
    );
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get organization members
    const members = await this.userRepository.find(
      { organization: organizationId },
      'firstName lastName email role status lastLoginAt',
    );

    const planConfig = getPlanConfig(organization.plan);

    // Convert to plain object if it has toJSON method
    const organizationData = organization.toJSON
      ? organization.toJSON()
      : organization;

    return {
      ...organizationData,
      members,
      planConfig,
      usage: {
        currentUsers: organization.userCount,
        userLimit: planConfig.userLimit,
        canAddUsers:
          planConfig.userLimit === -1 ||
          organization.userCount < planConfig.userLimit,
      },
    };
  }

  async upgradePlan(organizationId: string, userId: string, newPlan: PlanType) {
    // Verify user is owner
    const user = await this.userRepository.findOne({
      _id: userId,
      organization: organizationId,
      role: UserRole.OWNER,
    });

    if (!user) {
      throw new UnauthorizedException(
        'Only organization owners can upgrade plans',
      );
    }

    const organization = await this.organizationRepository.findById(
      organizationId,
    );
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const newPlanConfig = getPlanConfig(newPlan);

    // Validate upgrade path
    if (this.isDowngrade(organization.plan, newPlan)) {
      throw new BadRequestException(
        'Plan downgrades are not supported. Please contact support.',
      );
    }

    // Update organization
    const updatedOrg = await this.organizationRepository.findByIdAndUpdate(
      organizationId,
      {
        plan: newPlan,
        userLimit: newPlanConfig.userLimit,
        status: 'active',
        $unset: { trialEndsAt: 1 }, // Remove trial end date using $unset
      },
      { new: true },
    );

    return {
      message: 'Plan upgraded successfully',
      organization: updatedOrg,
      planConfig: newPlanConfig,
    };
  }

  private isDowngrade(currentPlan: PlanType, newPlan: PlanType): boolean {
    const planHierarchy = {
      [PlanType.TRIAL]: 0,
      [PlanType.STARTER]: 1,
      [PlanType.REGULAR]: 2,
      [PlanType.PREMIUM]: 3,
    };

    return planHierarchy[newPlan] < planHierarchy[currentPlan];
  }

  async removeUser(
    organizationId: string,
    userIdToRemove: string,
    requesterId: string,
  ) {
    // Verify requester permissions
    const requester = await this.userRepository.findOne({
      _id: requesterId,
      organization: organizationId,
    });

    if (
      !requester ||
      (requester.role !== UserRole.OWNER && requester.role !== UserRole.ADMIN)
    ) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    const userToRemove = await this.userRepository.findById(userIdToRemove);
    if (
      !userToRemove ||
      userToRemove.organization.toString() !== organizationId
    ) {
      throw new NotFoundException('User not found in organization');
    }

    // Prevent owner from being removed
    if (userToRemove.role === UserRole.OWNER) {
      throw new BadRequestException('Organization owner cannot be removed');
    }

    // Remove user
    await this.userRepository.findByIdAndDelete(userIdToRemove);

    // Update organization user count
    await this.organizationRepository.findByIdAndUpdate(organizationId, {
      $inc: { userCount: -1 },
    });

    return {
      message: 'User removed successfully',
    };
  }
}
