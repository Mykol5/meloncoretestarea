import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { OverviewService } from './overview.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('dashboard-stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(
    @Query('timeframe') timeframe: string,
    @Request() req,
  ) {
    try {
      const stats = await this.overviewService.getDashboardStats(
        timeframe || '6months',
        req.user,
      );
      return stats;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('program-progress')
  @UseGuards(JwtAuthGuard)
  async getProgramProgress(@Request() req) {
    try {
      const progress = await this.overviewService.getProgramProgress(req.user);
      return progress;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('regional-distribution')
  @UseGuards(JwtAuthGuard)
  async getRegionalDistribution(@Request() req) {
    try {
      const distribution = await this.overviewService.getRegionalDistribution(
        req.user,
      );
      return distribution;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
