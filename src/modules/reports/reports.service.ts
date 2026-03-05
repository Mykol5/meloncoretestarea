import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportsRepository } from './repository/reports.repository';
import { CreateReportDto } from './dto/create-reports.dto';
import { UpdateReportDto } from './dto/update-reports.dto';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { ReportStatus, ReportCategory, QuestionType } from 'src/libs/constants';
import { ImpactMetricsService } from '../impact-metrics/impact-metrics.service';
import { ShareReportDto } from './dto/share-report.dto';
import { EmailService } from 'src/infra/email/email.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject('REPORTS_REPOSITORY')
    private readonly reportsRepository: ReportsRepository,
    private readonly impactMetricsService: ImpactMetricsService,
    private readonly emailService: EmailService,
  ) {}

  async createReport(data: CreateReportDto, user: any) {
    try {
      const { sub: userId, organizationId } = user;

      const existingReport = await this.reportsRepository.findOne({
        title: data.title,
        organization: organizationId,
      });

      if (existingReport) {
        throw new BadRequestException(
          'Report title already exists for this organization',
        );
      }

      // Validate Impact Metric questions
      if (data.questions) {
        for (const question of data.questions) {
          if (question.type === QuestionType.IMPACT_METRIC) {
            if (!question.impactMetricId) {
              throw new BadRequestException(
                `Impact Metric ID is required for question: ${question.title}`,
              );
            }

            try {
              await this.impactMetricsService.getImpactMetricById(
                question.impactMetricId.toString(),
                { organizationId, sub: userId },
              );
            } catch (error) {
              throw new BadRequestException(
                `Invalid Impact Metric ID for question: ${question.title}`,
              );
            }
          }
        }
      }

      // Process questions - ensure required field is set
      const processedQuestions = (data.questions || []).map((question) => ({
        ...question,
        required: question.required ?? false,
      }));

      const reportData = {
        ...data,
        organization: organizationId,
        createdBy: userId,
        updatedBy: userId,
        status: data.status || ReportStatus.DRAFT,
        category: data.category || ReportCategory.IMPACT_ASSESSMENT,
        allowMultipleResponses: data.allowMultipleResponses || false,
        collectEmail: data.collectEmail || false,
        isPublic: data.isPublic || false,
        questions: processedQuestions,
        responseCount: data.responseCount || 0,
      };

      const report = await this.reportsRepository.create(reportData);
      return report;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getReportWithImpactMetrics(id: string, user?: any) {
    try {
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

      const report = await this.reportsRepository.findById(id, {
        populate: populateOptions,
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (
        user &&
        report.organization.toString() !== user.organizationId.toString()
      ) {
        throw new NotFoundException('Report not found');
      }

      // Populate impact metrics data for questions of type 'impact_metric'
      const enrichedQuestions = await Promise.all(
        report.questions.map(async (question) => {
          if (
            question.type === QuestionType.IMPACT_METRIC &&
            question.impactMetricId
          ) {
            try {
              const impactMetric =
                await this.impactMetricsService.getImpactMetricById(
                  question.impactMetricId.toString(),
                  user || { organizationId: report.organization },
                );

              return {
                ...question,
                impactMetricData: {
                  _id: impactMetric.id || impactMetric._id,
                  name: impactMetric.name,
                  target: impactMetric.target,
                  metricType: impactMetric.metricType,
                  actualValue: impactMetric.actualValue,
                  progressPercentage: impactMetric.progressPercentage,
                  trackingStatus: impactMetric.trackingStatus,
                  scoringWeight: impactMetric.scoringWeight,
                  startDate: impactMetric.startDate,
                  endDate: impactMetric.endDate,
                },
              };
            } catch (error) {
              return {
                ...question,
                impactMetricData: null,
                error: 'Impact metric not found or inaccessible',
              };
            }
          }
          return question;
        }),
      );

      // Safe object conversion with fallback
      const reportData = report.toObject ? report.toObject() : { ...report };

      return {
        ...reportData,
        questions: enrichedQuestions,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getReportById(id: string, user?: any) {
    return this.getReportWithImpactMetrics(id, user);
  }

  async findAllReports(
    pagination: { pageSize: number; currentPage: number },
    filters: { status?: string; category?: string; search?: string },
    user: any,
  ) {
    try {
      const { organizationId } = user;
      const query: any = { organization: organizationId };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.category) {
        query.category = filters.category;
      }

      // Handle search
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
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

      const reports = await this.reportsRepository.findPaginated(
        pagination.pageSize,
        pagination.currentPage,
        query,
        populateOptions,
      );

      return reports;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getDashboardStats(user: any) {
    try {
      const { organizationId } = user;

      const stats = await this.reportsRepository.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            publishedReports: {
              $sum: {
                $cond: [{ $eq: ['$status', ReportStatus.PUBLISHED] }, 1, 0],
              },
            },
            draftReports: {
              $sum: { $cond: [{ $eq: ['$status', ReportStatus.DRAFT] }, 1, 0] },
            },
            totalResponses: { $sum: '$responseCount' },
            avgResponsesPerReport: { $avg: '$responseCount' },
          },
        },
      ]);

      const result =
        stats.length > 0
          ? stats[0]
          : {
              totalReports: 0,
              publishedReports: 0,
              draftReports: 0,
              totalResponses: 0,
              avgResponsesPerReport: 0,
            };

      const responseRate =
        result.totalReports > 0
          ? Math.round((result.totalResponses / result.totalReports) * 100)
          : 0;

      return {
        totalReports: result.totalReports,
        activeReports: result.publishedReports,
        draftReports: result.draftReports,
        totalResponses: result.totalResponses,
        avgResponseRate: `${responseRate}%`,
        avgResponsesPerReport: Math.round(result.avgResponsesPerReport || 0),
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateReport(id: string, dto: UpdateReportDto, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      if (dto.title) {
        const existingReport = await this.reportsRepository.findOne({
          title: dto.title,
          organization: organizationId,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingReport) {
          throw new BadRequestException(
            'Report title already exists for this organization',
          );
        }
      }

      // Validate Impact Metric questions if being updated
      if (dto.questions) {
        for (const question of dto.questions) {
          if (question.type === QuestionType.IMPACT_METRIC) {
            if (!question.impactMetricId) {
              throw new BadRequestException(
                `Impact Metric ID is required for question: ${question.title}`,
              );
            }

            try {
              await this.impactMetricsService.getImpactMetricById(
                question.impactMetricId.toString(),
                user,
              );
            } catch (error) {
              throw new BadRequestException(
                `Invalid Impact Metric ID for question: ${question.title}`,
              );
            }
          }
        }
      }

      // Process questions if provided
      const updateData: any = { ...dto, updatedBy: userId };
      if (dto.questions) {
        updateData.questions = dto.questions.map((question) => ({
          ...question,
          required: question.required ?? false,
        }));
      }

      const updatedReport = await this.reportsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        updateData,
      );

      if (!updatedReport) {
        throw new NotFoundException('Report not found');
      }

      return updatedReport;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateStatus(id: string, status: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      const updatedReport = await this.reportsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        { status, updatedBy: userId },
      );

      if (!updatedReport) {
        throw new NotFoundException('Report not found');
      }

      return updatedReport;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async publishReport(id: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;
      const report = await this.getReportById(id, user);

      if (report.status === ReportStatus.PUBLISHED) {
        throw new BadRequestException('Report is already published');
      }

      // Generate share token if not exists
      let shareToken = report.shareToken;
      if (!shareToken) {
        shareToken = uuidv4();
      }

      const publishedReport = await this.reportsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        {
          status: ReportStatus.PUBLISHED,
          shareToken,
          isPublic: true,
          updatedBy: userId,
        },
      );

      return publishedReport;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async duplicateReport(id: string, user: any) {
    try {
      const originalReport = await this.getReportById(id, user);
      const { organizationId, sub: userId } = user;

      const duplicateData = {
        title: `${originalReport.title} (Copy)`,
        description: originalReport.description,
        category: originalReport.category || ReportCategory.IMPACT_ASSESSMENT,
        organization: organizationId,
        createdBy: userId,
        updatedBy: userId,
        status: ReportStatus.DRAFT,
        allowMultipleResponses: originalReport.allowMultipleResponses,
        collectEmail: originalReport.collectEmail,
        isPublic: false,
        questions: originalReport.questions,
        responseCount: 0,
      };

      const duplicatedReport = await this.reportsRepository.create(
        duplicateData,
      );
      return duplicatedReport;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async deleteReport(id: string, user: any) {
    try {
      const { organizationId } = user;

      // Check if report exists and belongs to the organization
      const existingReport = await this.reportsRepository.findOne({
        _id: id,
        organization: organizationId,
      });

      if (!existingReport) {
        throw new NotFoundException('Report not found');
      }

      const result = await this.reportsRepository.findOneAndDelete({
        _id: id,
        organization: organizationId,
      });

      if (!result.status) {
        throw new NotFoundException('Report not found');
      }

      return { message: 'Report deleted successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getReportByShareToken(shareToken: string) {
    try {
      let report = await this.reportsRepository.findOne({
        shareToken,
        status: 'PUBLISHED',
        isPublic: true,
      });

      if (!report) {
        report = await this.reportsRepository.findById(shareToken);

        if (!report || report.status !== 'PUBLISHED' || !report.isPublic) {
          throw new NotFoundException(
            'Report not found or not publicly accessible',
          );
        }
      }
      return report;
    } catch (error) {
      console.error('Error fetching public report:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch report');
    }
  }

  async generateShareLink(id: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;
      const report = await this.getReportById(id, user);

      let shareToken = report.shareToken;
      if (!shareToken) {
        shareToken = uuidv4();
        await this.reportsRepository.findOneAndUpdate(
          { _id: new Types.ObjectId(id), organization: organizationId },
          { shareToken, updatedBy: userId },
        );
      }

      return {
        shareToken,
        shareUrl: `${process.env.FRONTEND_URL}/reports/public/${shareToken}`,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getReportsWithMetricsSummary(user: any) {
    try {
      const { organizationId } = user;

      const reports = await this.reportsRepository.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId) } },
        { $unwind: { path: '$questions', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'impactmetrics',
            localField: 'questions.impactMetricId',
            foreignField: '_id',
            as: 'metricData',
          },
        },
        {
          $group: {
            _id: '$_id',
            title: { $first: '$title' },
            status: { $first: '$status' },
            category: { $first: '$category' },
            createdAt: { $first: '$createdAt' },
            responseCount: { $first: '$responseCount' },
            impactMetricsCount: {
              $sum: {
                $cond: [
                  { $eq: ['$questions.type', QuestionType.IMPACT_METRIC] },
                  1,
                  0,
                ],
              },
            },
            totalQuestions: { $sum: 1 },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return reports;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async shareReportViaEmail(
    reportId: string,
    shareEmailDto: ShareReportDto,
    user: any,
  ) {
    try {
      const report = await this.getReportById(reportId, user);

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (report.status !== 'PUBLISHED') {
        throw new BadRequestException('Only published reports can be shared');
      }

      // Generate share URL
      const shareUrl = `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/reports/public/${report.shareToken || reportId}`;

      const reportData = {
        id: reportId,
        title: report.title,
        description: report.description || 'No description provided',
        questionCount: report.questions?.length || 0,
        responseCount: report.responseCount || 0,
        shareUrl,
        isPublic: report.isPublic || false,
      };

      const senderData = {
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
      };

      await this.emailService.sendReportShare(
        shareEmailDto.recipients,
        reportData,
        senderData,
        shareEmailDto.personalMessage,
      );

      return {
        message: 'Report shared successfully',
        recipientCount: shareEmailDto.recipients.length,
        shareUrl,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }
}
