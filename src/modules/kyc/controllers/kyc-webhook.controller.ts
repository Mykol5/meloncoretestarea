import {
  Controller,
  Post,
  Patch,
  Body,
  BadRequestException,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { KYCService } from '../kyc.service';
import {
  AgentAssignmentDto,
  StartReviewDto,
  SubmitVerificationDto,
} from '../dto/webhook.dto';

@Controller('api/kyc/webhook')
export class KYCWebhookController {
  constructor(private readonly kycService: KYCService) {}

  private validateWebhookAuth(authHeader: string) {
    const expectedKey = process.env.MOBILE_API_KEY;

    if (!expectedKey) {
      throw new UnauthorizedException('Webhook authentication not configured');
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7);

    if (token !== expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }
  }

  @Post('assign')
  async handleAgentAssignment(
    @Headers('authorization') authHeader: string,
    @Body() data: AgentAssignmentDto,
  ) {
    try {
      this.validateWebhookAuth(authHeader);

      const result = await this.kycService.handleAgentAssignment(
        data.web_job_id,
        data.agent_id,
        data.mobile_job_id,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('start-review')
  async handleStartReview(
    @Headers('authorization') authHeader: string,
    @Body() data: StartReviewDto,
  ) {
    try {
      this.validateWebhookAuth(authHeader);

      const result = await this.kycService.handleStartReview(
        data.web_job_id,
        data.mobile_job_id,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('submit-verification')
  async handleVerificationSubmission(
    @Headers('authorization') authHeader: string,
    @Body() data: SubmitVerificationDto,
  ) {
    try {
      this.validateWebhookAuth(authHeader);

      const result = await this.kycService.handleVerificationSubmission(data);

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
