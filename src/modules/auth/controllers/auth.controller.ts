import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { OrganizationService } from '../services/organization.service';
import { SignUpDto } from '../dto/signup.dto';
import { SignInDto } from '../dto/sigin.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { OrganizationOwnerGuard } from '../guard/organization-owner.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { PlanType } from 'src/libs/constants';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create new user account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in user' })
  @ApiResponse({ status: 200, description: 'Signed in successfully' })
  async signin(@Body() signinDto: SignInDto) {
    return this.authService.signin(signinDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getCurrentUser(@GetUser() user: any) {
    return this.authService.getCurrentUser(user.sub);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite user to organization' })
  @ApiResponse({ status: 201, description: 'User invited successfully' })
  async inviteUser(@GetUser() user: any, @Body() inviteDto: InviteUserDto) {
    return this.authService.inviteUser(user.sub, inviteDto);
  }

  @Get('organization')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({
    status: 200,
    description: 'Organization details retrieved successfully',
  })
  async getOrganization(@GetUser() user: any) {
    return this.organizationService.getOrganizationDetails(
      user.organizationId,
      user.sub,
    );
  }

  @Patch('organization/upgrade/:plan')
  @UseGuards(JwtAuthGuard, OrganizationOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade organization plan' })
  @ApiResponse({ status: 200, description: 'Plan upgraded successfully' })
  async upgradePlan(@GetUser() user: any, @Param('plan') plan: PlanType) {
    return this.organizationService.upgradePlan(
      user.organizationId,
      user.sub,
      plan,
    );
  }

  @Delete('organization/users/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove user from organization' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  async removeUser(@GetUser() user: any, @Param('userId') userId: string) {
    return this.organizationService.removeUser(
      user.organizationId,
      userId,
      user.sub,
    );
  }
}
