/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResponsesRepository } from './repository/responses.repository';
import { CreateResponseDto } from './dto/create-response.dto';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';
import { Types } from 'mongoose';
import { ReportsService } from '../reports/reports.service';
import { ImpactMetricsService } from '../impact-metrics/impact-metrics.service';
import { QuestionType } from 'src/libs/constants';

@Injectable()
export class ResponsesService {
  constructor(
    @Inject('RESPONSES_REPOSITORY')
    private readonly responsesRepository: ResponsesRepository,
    private readonly reportsService: ReportsService,
    private readonly impactMetricsService: ImpactMetricsService,
  ) {}

  async submitResponse(
    data: CreateResponseDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      // Get the report to validate questions and check if it's public
      const report = await this.reportsService.getReportByShareToken(
        data.reportId.toString(),
      );

      if (!report) {
        throw new BadRequestException('Report not found or not accessible');
      }

      // Validate responses against report questions
      const reportQuestions = report.questions;
      const impactMetricUpdates: Array<{
        metricId: Types.ObjectId;
        actualValue: number;
      }> = [];

      for (const response of data.responses) {
        const question = reportQuestions.find(
          (q) => q.id === response.questionId,
        );

        if (!question) {
          throw new BadRequestException(
            `Invalid question ID: ${response.questionId}`,
          );
        }

        // Handle Impact Metric questions
        if (question.type === QuestionType.IMPACT_METRIC) {
          if (!response.actualValue && response.actualValue !== 0) {
            throw new BadRequestException(
              `Actual value is required for impact metric question: ${question.title}`,
            );
          }

          if (question.impactMetricId) {
            impactMetricUpdates.push({
              metricId: question.impactMetricId,
              actualValue: response.actualValue,
            });
          }
        }

        // Validate required questions
        if (
          question.required &&
          !response.answer &&
          response.answer !== 0 &&
          !response.actualValue
        ) {
          throw new BadRequestException(
            `Answer is required for question: ${question.title}`,
          );
        }
      }

      // Create the response record
      const responseData = {
        ...data,
        submittedAt: new Date(),
        ipAddress,
        userAgent,
      };

      const savedResponse = await this.responsesRepository.create(responseData);

      // Update Impact Metrics with actual values
      const metricUpdatePromises = impactMetricUpdates.map((update) =>
        this.impactMetricsService.updateMetricValue(
          {
            metricId: update.metricId,
            actualValue: update.actualValue,
          },
          { organizationId: report.organization },
        ),
      );

      await Promise.all(metricUpdatePromises);

      // Update report response count
      await this.reportsService.updateReport(
        report._id.toString(),
        { responseCount: (report.responseCount || 0) + 1 },
        { organizationId: report.organization, sub: report.createdBy },
      );

      return {
        message: 'Response submitted successfully',
        responseId: savedResponse._id,
        impactMetricsUpdated: impactMetricUpdates.length,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getResponsesByReport(
    reportId: string,
    pagination: { pageSize: number; currentPage: number },
    user: any,
  ) {
    try {
      const { organizationId } = user;

      // Verify user has access to this report
      const report = await this.reportsService.getReportById(reportId, user);
      if (!report) {
        throw new NotFoundException('Report not found');
      }

      const query = { reportId: new Types.ObjectId(reportId) };

      const populateOptions = [
        {
          path: 'responses.impactMetricId',
          select: 'name target metricType trackingStatus progressPercentage',
        },
      ];

      const responses = await this.responsesRepository.findPaginated(
        pagination.pageSize,
        pagination.currentPage,
        query,
        populateOptions,
      );

      return responses;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getResponseById(responseId: string, user: any) {
    try {
      const response = await this.responsesRepository.findById(responseId);

      if (!response) {
        throw new NotFoundException('Response not found');
      }

      // Verify user has access to the associated report
      await this.reportsService.getReportById(
        response.reportId.toString(),
        user,
      );

      return response;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getResponseAnalytics(reportId: string, user: any) {
    try {
      // Verify user has access to this report
      await this.reportsService.getReportById(reportId, user);

      const analytics = await this.responsesRepository.aggregate([
        { $match: { reportId: new Types.ObjectId(reportId) } },
        { $unwind: '$responses' },
        {
          $group: {
            _id: '$responses.questionId',
            totalResponses: { $sum: 1 },
            answers: { $push: '$responses.answer' },
            actualValues: { $push: '$responses.actualValue' },
            avgActualValue: { $avg: '$responses.actualValue' },
          },
        },
      ]);

      return analytics;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getImpactMetricsProgress(reportId: string, user: any) {
    try {
      // Verify user has access to this report
      const report = await this.reportsService.getReportById(reportId, user);

      // Get all impact metric questions from the report
      const impactMetricQuestions = report.questions.filter(
        (q) => q.type === QuestionType.IMPACT_METRIC && q.impactMetricId,
      );

      if (impactMetricQuestions.length === 0) {
        return {
          message: 'No impact metrics found in this report',
          metrics: [],
        };
      }

      // Get current status of all impact metrics
      const metricsProgress = await Promise.all(
        impactMetricQuestions.map(async (question) => {
          const metric = await this.impactMetricsService.getImpactMetricById(
            question.impactMetricId.toString(),
            user,
          );

          // Get response count for this metric
          const responseCount = await this.responsesRepository.count({
            reportId: new Types.ObjectId(reportId),
            'responses.impactMetricId': question.impactMetricId,
          });

          return {
            questionId: question.id,
            questionTitle: question.title,
            metricId: metric._id,
            metricName: metric.name,
            target: metric.target,
            actualValue: metric.actualValue,
            progressPercentage: metric.progressPercentage,
            trackingStatus: metric.trackingStatus,
            scoringWeight: metric.scoringWeight,
            responseCount,
            startDate: metric.startDate,
            endDate: metric.endDate,
          };
        }),
      );

      // Calculate overall progress
      const totalWeight = metricsProgress.reduce(
        (sum, metric) => sum + metric.scoringWeight,
        0,
      );
      const weightedProgress = metricsProgress.reduce(
        (sum, metric) =>
          sum + (metric.progressPercentage * metric.scoringWeight) / 100,
        0,
      );
      const overallProgress =
        totalWeight > 0
          ? Math.round((weightedProgress / totalWeight) * 100)
          : 0;

      return {
        overallProgress,
        totalMetrics: metricsProgress.length,
        metrics: metricsProgress,
        summary: {
          achieved: metricsProgress.filter(
            (m) => m.trackingStatus === 'ACHIEVED',
          ).length,
          onTrack: metricsProgress.filter(
            (m) => m.trackingStatus === 'ON_TRACK',
          ).length,
          failing: metricsProgress.filter((m) => m.trackingStatus === 'FAIL')
            .length,
        },
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }
}
