import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { KYCUser } from '../model/kyc-user.model';

@Injectable()
export class MobileIntegrationService {
  private readonly logger = new Logger(MobileIntegrationService.name);
  private readonly apiKey = process.env.MOBILE_API_KEY;
  private readonly baseUrl = process.env.MOBILE_BASE_URL;

  async createMobileJob(kycUser: KYCUser) {
    if (!this.apiKey || !this.baseUrl) {
      this.logger.warn('Mobile API credentials not configured');
      return null;
    }

    const payload = {
      title: `KYC Verification - ${kycUser.firstName} ${kycUser.lastName}`,
      description: `Verify address: ${kycUser.streetNumber || ''} ${
        kycUser.streetName || ''
      }, ${kycUser.landmark || ''}, ${kycUser.city || ''}, ${
        kycUser.state || ''
      } Phone number: ${kycUser.phone || ''}`.trim(),
      job_type: 'kyc_verification',
      sub_type: 'Address Verification',
      payout: '$2',
      urgency: 'medium',
      deadline: '24 hours',
      latitude: kycUser.latitude,
      longitude: kycUser.longitude,
      radius: 5,
      location_name: `${kycUser.city || 'Location'}, ${
        kycUser.state || ''
      }`.trim(),
      requirements: 'Smartphone with camera, GPS enabled',
      claim_window: 2,
      web_job_id: kycUser._id.toString(),
      web_created_by: 'system@melon.ng',
    };

    try {
      this.logger.log(`Creating mobile job for KYC user: ${kycUser._id}`);

      const response = await axios.post(
        `${this.baseUrl}/api/web/jobs/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log(
        `Mobile job created successfully: ${response.data.data?.mobile_job_id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create mobile job:', error.message);
      if (error.response) {
        this.logger.error('Response error:', error.response.data);
      }
      throw new BadRequestException('Failed to create mobile job');
    }
  }

  async updateMobileJobStatus(webJobId: string, status: string) {
    if (!this.apiKey || !this.baseUrl || !webJobId) {
      this.logger.warn(
        'Cannot update mobile job status - missing credentials or job ID',
      );
      return null;
    }

    try {
      this.logger.log(
        `Updating mobile job for web_job_id ${webJobId} to status: ${status}`,
      );

      const response = await axios.patch(
        `${this.baseUrl}/api/webhook/jobs/${webJobId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(`Mobile job status updated successfully`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update mobile job status:', error.message);
      if (error.response) {
        this.logger.error('Response error:', error.response.data);
      }
    }
  }

  async testConnection() {
    if (!this.apiKey || !this.baseUrl) {
      throw new BadRequestException('Mobile API credentials not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/web/jobs/test`,
        { test: true },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Mobile API connection test failed:', error.message);
      throw new BadRequestException('Failed to connect to mobile API');
    }
  }
}
