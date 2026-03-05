import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Patch,
  Delete,
  Request,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ImpactMetricsService } from './impact-metrics.service';
import { CreateImpactMetricDto } from './dto/create-impact-metric.dto';
import { UpdateImpactMetricDto } from './dto/update-impact-metric.dto';
import { MetricResponseDto } from './dto/metric-response.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('impact-metrics')
@UseGuards(JwtAuthGuard)
export class ImpactMetricsController {
  constructor(private readonly impactMetricsService: ImpactMetricsService) {}

  @Post('create')
  async createImpactMetric(
    @Body() metricDto: CreateImpactMetricDto,
    @Request() req,
  ) {
    try {
      const createdMetric = await this.impactMetricsService.createImpactMetric(
        metricDto,
        req.user,
      );
      return createdMetric;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('all')
  async findAllImpactMetrics(
    @Query('pageSize') pageSize: string,
    @Query('currentPage') currentPage: string,
    @Query('status') status: string,
    @Query('metricType') metricType: string,
    @Query('search') search: string,
    @Query('isActive') isActive: string,
    @Request() req,
  ) {
    try {
      const paginationParams = {
        pageSize: parseInt(pageSize, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
      };

      const filters = {
        status,
        metricType,
        search,
        isActive:
          isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const metrics = await this.impactMetricsService.findAllImpactMetrics(
        paginationParams,
        filters,
        req.user,
      );
      return metrics;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('dropdown')
  async getImpactMetricsDropdown(@Request() req) {
    try {
      const metrics = await this.impactMetricsService.getImpactMetricsDropdown(
        req.user,
      );
      return metrics;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('dashboard')
  async getDashboardStats(@Request() req) {
    try {
      const stats = await this.impactMetricsService.getDashboardStats(req.user);
      return stats;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('details/:id')
  async getImpactMetricDetails(@Param('id') id: string, @Request() req) {
    try {
      const metric = await this.impactMetricsService.getImpactMetricById(
        id,
        req.user,
      );
      return metric;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('update/:id')
  async updateImpactMetric(
    @Param('id') id: string,
    @Body() updateData: UpdateImpactMetricDto,
    @Request() req,
  ) {
    try {
      const updatedMetric = await this.impactMetricsService.updateImpactMetric(
        id,
        updateData,
        req.user,
      );
      return updatedMetric;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('update-value')
  async updateMetricValue(
    @Body() metricResponse: MetricResponseDto,
    @Request() req,
  ) {
    try {
      const updatedMetric = await this.impactMetricsService.updateMetricValue(
        metricResponse,
        req.user,
      );
      return updatedMetric;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('deactivate/:id')
  async deactivateImpactMetric(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.impactMetricsService.deactivateImpactMetric(
        id,
        req.user,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
