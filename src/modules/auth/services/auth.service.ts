import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repository/users.repository';
import { OrganizationRepository } from '../repository/organization.repository';
import { SignUpDto } from '../dto/signup.dto';
import { SignInDto } from '../dto/sigin.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import {
  UserRole,
  UserStatus,
  PlanType,
  OrganizationStatus,
} from 'src/libs/constants';
import { EmailService } from 'src/infra/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signup(signupDto: SignUpDto) {
    try {
      const emailDomain = signupDto.email.split('@')[1].toLowerCase();

      const existingUser = await this.userRepository.findOne({
        email: signupDto.email.toLowerCase(),
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      let organization = await this.organizationRepository.findByDomain(
        emailDomain,
      );

      if (!organization) {
        const orgName =
          signupDto.organizationName || this.generateOrgName(emailDomain);

        organization = await this.organizationRepository.create({
          name: orgName,
          domain: emailDomain,
          allowedDomains: [emailDomain],
          plan: PlanType.TRIAL,
          status: OrganizationStatus.TRIAL,
          userCount: 0,
          userLimit: 2,
          trialEndsAt: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000), // 8 weeks
        });

        await this.organizationRepository.save(organization);
      }

      const hashedPassword = await bcrypt.hash(signupDto.password, 10);
      const isFirstUser = organization.userCount === 0;
      const verificationToken = this.generateVerificationToken();

      const user = await this.userRepository.create({
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        email: signupDto.email.toLowerCase(),
        username: signupDto.username || signupDto.email.split('@')[0],
        phoneNumber: signupDto.phoneNumber,
        password: hashedPassword,
        organization: organization._id,
        role: isFirstUser ? UserRole.OWNER : UserRole.MEMBER,
        status: UserStatus.PENDING,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const savedUser = await this.userRepository.save(user);

      await this.organizationRepository.findByIdAndUpdate(organization._id, {
        $inc: { userCount: 1 },
      });

      this.emailService
        .sendVerificationEmail(
          savedUser.email,
          verificationToken,
          savedUser.firstName,
        )
        .catch((err) => {
          console.error('Email sending failed:', err);
        });

      return {
        message:
          'Account created successfully. Please check your email to verify your account.',
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          organizationId: organization._id,
          organizationName: organization.name,
        },
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('User with this email already exists');
      }
      throw error;
    }
  }

  async signin(signinDto: SignInDto) {
    const user = await this.userRepository.findOne(
      { email: signinDto.email.toLowerCase() },
      '+password',
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      signinDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Account is not active. Please verify your email.',
      );
    }

    await this.userRepository.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
    });

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      organizationId: user.organization.toString(),
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const organization = await this.organizationRepository.findById(
      user.organization,
    );

    return {
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organization,
        organizationName: organization?.name,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepository.findByIdAndUpdate(user._id, {
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return {
      message: 'Email verified successfully. You can now sign in.',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organizationRepository.findById(
      user.organization,
    );

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      organization: {
        id: organization?._id,
        name: organization?.name,
        domain: organization?.domain,
        plan: organization?.plan,
        status: organization?.status,
      },
    };
  }

  async inviteUser(inviterId: string, inviteDto: InviteUserDto) {
    const inviter = await this.userRepository.findById(inviterId);

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    if (inviter.role !== UserRole.OWNER && inviter.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        'Only owners and admins can invite users',
      );
    }

    const emailDomain = inviteDto.email.split('@')[1].toLowerCase();
    const organization = await this.organizationRepository.findById(
      inviter.organization,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (!organization.allowedDomains.includes(emailDomain)) {
      throw new BadRequestException(
        `Email domain ${emailDomain} is not allowed for this organization`,
      );
    }

    const existingUser = await this.userRepository.findOne({
      email: inviteDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const verificationToken = this.generateVerificationToken();

    const user = await this.userRepository.create({
      firstName: inviteDto.email.split('@')[0],
      lastName: '',
      email: inviteDto.email.toLowerCase(),
      username: inviteDto.email.split('@')[0],
      organization: organization._id,
      role: inviteDto.role || UserRole.MEMBER,
      status: UserStatus.INVITED,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: inviter._id,
      invitedAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    await this.organizationRepository.findByIdAndUpdate(organization._id, {
      $inc: { userCount: 1 },
    });

    await this.emailService.sendInvitationEmail(
      savedUser.email,
      verificationToken,
      `${inviter.firstName} ${inviter.lastName}`,
      organization.name,
    );

    return {
      message: 'User invited successfully',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  }

  private generateOrgName(domain: string): string {
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private generateVerificationToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
