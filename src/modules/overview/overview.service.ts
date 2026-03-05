/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { KYCService } from '../kyc/kyc.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';

@Injectable()
export class OverviewService {
  constructor(
    private readonly kycService: KYCService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async getDashboardStats(timeframe: string, user: any) {
    try {
      const [kycStats, projectStats] = await Promise.all([
        this.kycService.getDashboardStats(user),
        this.portfolioService.getProjectStats(user),
      ]);

      const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
      };

      return {
        totalPrograms: {
          value: projectStats.totalProjects.toString(),
          description: 'Total programs',
        },
        activeProjects: {
          value: projectStats.activeProjects.toString(),
          description: 'Currently running',
        },
        beneficiaries: {
          value: formatNumber(projectStats.totalBeneficiaries),
          description: 'People reached',
        },
        verifiedUsers: {
          value: kycStats.verified.toString(),
          description: 'Verified customers',
        },
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getProgramProgress(user: any) {
    try {
      return [];
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getRegionalDistribution(user: any) {
    try {
      const { organizationId } = user;

      const distribution = await this.portfolioService.getRegionalStats(
        organizationId,
      );

      return distribution;
    } catch (error) {
      handleErrorCatch(error);
    }
  }
}
