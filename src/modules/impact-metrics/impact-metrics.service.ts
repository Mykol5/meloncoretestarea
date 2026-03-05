import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImpactMetricsRepository } from './repository/impact-metrics.repository';
import { CreateImpactMetricDto } from './dto/create-impact-metric.dto';
import { UpdateImpactMetricDto } from './dto/update-impact-metric.dto';
import { MetricResponseDto } from './dto/metric-response.dto';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';
import { Types } from 'mongoose';
import { TrackingStatus } from 'src/libs/constants';

@Injectable()
export class ImpactMetricsService {
  constructor(
    @Inject('IMPACT_METRICS_REPOSITORY')
    private readonly impactMetricsRepository: ImpactMetricsRepository,
  ) {}

  private calculateProgress(
    actualValue: number,
    target: number,
  ): {
    progressPercentage: number;
    trackingStatus: TrackingStatus;
  } {
    const progressPercentage = Math.round((actualValue / target) * 100);

    let trackingStatus: TrackingStatus;
    if (progressPercentage < 50) {
      trackingStatus = TrackingStatus.FAIL;
    } else if (progressPercentage >= 50 && progressPercentage < 100) {
      trackingStatus = TrackingStatus.ON_TRACK;
    } else {
      trackingStatus = TrackingStatus.ACHIEVED;
    }

    return { progressPercentage, trackingStatus };
  }

  async createImpactMetric(data: CreateImpactMetricDto, user: any) {
    try {
      const { sub: userId, organizationId } = user;

      const existingMetric = await this.impactMetricsRepository.findOne({
        name: data.name,
        organization: organizationId,
        isActive: true,
      });

      if (existingMetric) {
        throw new BadRequestException(
          'Impact metric name already exists for this organization',
        );
      }

      let progressData = {
        progressPercentage: 0,
        trackingStatus: data.trackingStatus || TrackingStatus.ON_TRACK,
      };

      if (data.actualValue !== undefined) {
        progressData = this.calculateProgress(data.actualValue, data.target);
      }

      const metricData = {
        ...data,
        organization: organizationId,
        createdBy: userId,
        updatedBy: userId,
        ...progressData,
        isActive: true,
      };

      const metric = await this.impactMetricsRepository.create(metricData);
      return await this.impactMetricsRepository.save(metric);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async findAllImpactMetrics(
    pagination: { pageSize: number; currentPage: number },
    filters: {
      status?: string;
      metricType?: string;
      search?: string;
      isActive?: boolean;
    },
    user: any,
  ) {
    try {
      const { organizationId } = user;
      const query: any = { organization: organizationId };

      if (filters.status) {
        query.trackingStatus = filters.status;
      }
      if (filters.metricType) {
        query.metricType = filters.metricType;
      }
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      } else {
        query.isActive = true;
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const populateOptions = [
        {
          path: 'createdBy',
          select: 'firstName lastName username email',
        },
        {
          path: 'updatedBy',
          select: 'firstName lastName username email',
        },
      ];

      const metrics = await this.impactMetricsRepository.findPaginated(
        pagination.pageSize,
        pagination.currentPage,
        query,
        populateOptions,
      );

      return metrics;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getImpactMetricsDropdown(user: any) {
    try {
      const { organizationId } = user;
      const metrics = await this.impactMetricsRepository.find(
        { organization: organizationId, isActive: true },
        null,
        { createdAt: -1 },
      );

      return metrics.map((metric) => ({
        id: metric.id || metric._id,
        value: metric.name,
        target: metric.target,
        metricType: metric.metricType,
        scoringWeight: metric.scoringWeight,
        startDate: metric.startDate,
        endDate: metric.endDate,
      }));
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getImpactMetricById(id: string, user: any) {
    try {
      const { organizationId } = user;
      const populateOptions = [
        {
          path: 'createdBy',
          select: 'firstName lastName username email',
        },
        {
          path: 'updatedBy',
          select: 'firstName lastName username email',
        },
      ];

      const metric = await this.impactMetricsRepository.findById(
        id,
        populateOptions,
      );

      if (!metric) {
        throw new NotFoundException('Impact metric not found');
      }

      if (metric.organization.toString() !== organizationId.toString()) {
        throw new NotFoundException('Impact metric not found');
      }

      return metric;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateImpactMetric(id: string, dto: UpdateImpactMetricDto, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      if (dto.name) {
        const existingMetric = await this.impactMetricsRepository.findOne({
          name: dto.name,
          organization: organizationId,
          isActive: true,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingMetric) {
          throw new BadRequestException(
            'Impact metric name already exists for this organization',
          );
        }
      }

      const currentMetric = await this.getImpactMetricById(id, user);

      let updateData: any = { ...dto, updatedBy: userId };

      if (dto.actualValue !== undefined || dto.target !== undefined) {
        const actualValue = dto.actualValue ?? currentMetric.actualValue ?? 0;
        const target = dto.target ?? currentMetric.target;

        const progressData = this.calculateProgress(actualValue, target);
        updateData = { ...updateData, ...progressData };
      }

      const updatedMetric = await this.impactMetricsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        updateData,
      );

      if (!updatedMetric) {
        throw new NotFoundException('Impact metric not found');
      }

      return updatedMetric;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateMetricValue(metricResponse: MetricResponseDto, user: any) {
    try {
      const { organizationId } = user;
      const { metricId, actualValue } = metricResponse;

      const metric = await this.getImpactMetricById(metricId.toString(), user);
      const progressData = this.calculateProgress(actualValue, metric.target);

      const updatedMetric = await this.impactMetricsRepository.findOneAndUpdate(
        { _id: metricId, organization: organizationId },
        {
          actualValue,
          ...progressData,
          updatedBy: user.sub,
        },
      );

      return updatedMetric;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async deactivateImpactMetric(id: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      const updatedMetric = await this.impactMetricsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        { isActive: false, updatedBy: userId },
      );

      if (!updatedMetric) {
        throw new NotFoundException('Impact metric not found');
      }

      return { message: 'Impact metric deactivated successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getDashboardStats(user: any) {
    try {
      const { organizationId } = user;

      const stats = await this.impactMetricsRepository.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId),
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            totalMetrics: { $sum: 1 },
            achievedMetrics: {
              $sum: {
                $cond: [
                  { $eq: ['$trackingStatus', TrackingStatus.ACHIEVED] },
                  1,
                  0,
                ],
              },
            },
            onTrackMetrics: {
              $sum: {
                $cond: [
                  { $eq: ['$trackingStatus', TrackingStatus.ON_TRACK] },
                  1,
                  0,
                ],
              },
            },
            failingMetrics: {
              $sum: {
                $cond: [
                  { $eq: ['$trackingStatus', TrackingStatus.FAIL] },
                  1,
                  0,
                ],
              },
            },
            avgProgress: { $avg: '$progressPercentage' },
            totalScoringWeight: { $sum: '$scoringWeight' },
          },
        },
      ]);

      const result =
        stats.length > 0
          ? stats[0]
          : {
              totalMetrics: 0,
              achievedMetrics: 0,
              onTrackMetrics: 0,
              failingMetrics: 0,
              avgProgress: 0,
              totalScoringWeight: 0,
            };

      return {
        totalMetrics: result.totalMetrics,
        achievedMetrics: result.achievedMetrics,
        onTrackMetrics: result.onTrackMetrics,
        failingMetrics: result.failingMetrics,
        avgProgress: Math.round(result.avgProgress || 0),
        totalScoringWeight: result.totalScoringWeight,
        overallScore: Math.round(result.avgProgress || 0),
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }
}
