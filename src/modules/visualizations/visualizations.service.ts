/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/visualizations/visualizations.service.ts

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSourceRepository } from './repository/data-source.repository';
import { ChartRepository } from './repository/chart.repository';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { CreateChartDto } from './dto/create-chart.dto';
import { UpdateChartDto } from './dto/update-chart.dto';
import { CsvImportDto } from './dto/csv-import.dto';
import { CreateDataSourceFromReportDto } from './dto/report-integration.dto';
import { FileProcessingService } from './services/file-processing.service';
import { DataAnalysisService } from './services/data-analysis.service';
import { ReportsService } from '../reports/reports.service';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { File as MulterFile } from 'multer';
import {
  DataSourceType,
  DataSourceStatus,
  ChartStatus,
  ChartType,
  AggregationType,
} from 'src/libs/constants';

@Injectable()
export class VisualizationsService {
  constructor(
    @Inject('DATA_SOURCE_REPOSITORY')
    private readonly dataSourceRepository: DataSourceRepository,
    @Inject('CHART_REPOSITORY')
    private readonly chartRepository: ChartRepository,
    private readonly fileProcessingService: FileProcessingService,
    private readonly dataAnalysisService: DataAnalysisService,
    private readonly reportsService: ReportsService,
  ) {}

  // Dashboard Stats
  async getDashboardStats(user: any) {
    try {
      const { entity } = user;

      const [dataSourceStats, chartStats] = await Promise.all([
        this.dataSourceRepository.aggregate([
          { $match: { entity: new Types.ObjectId(entity) } },
          {
            $group: {
              _id: null,
              totalDataSources: { $sum: 1 },
              totalRecords: { $sum: '$rowCount' },
              csvSources: {
                $sum: {
                  $cond: [{ $eq: ['$type', DataSourceType.CSV_IMPORT] }, 1, 0],
                },
              },
              reportSources: {
                $sum: {
                  $cond: [
                    { $eq: ['$type', DataSourceType.REPORT_RESPONSE] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
        this.chartRepository.aggregate([
          { $match: { entity: new Types.ObjectId(entity) } },
          {
            $group: {
              _id: null,
              totalCharts: { $sum: 1 },
              activeCharts: {
                $sum: {
                  $cond: [{ $eq: ['$status', ChartStatus.SAVED] }, 1, 0],
                },
              },
              sharedCharts: {
                $sum: { $cond: [{ $eq: ['$isShared', true] }, 1, 0] },
              },
            },
          },
        ]),
      ]);

      const dataResult =
        dataSourceStats.length > 0
          ? dataSourceStats[0]
          : {
              totalDataSources: 0,
              totalRecords: 0,
              csvSources: 0,
              reportSources: 0,
            };

      const chartResult =
        chartStats.length > 0
          ? chartStats[0]
          : {
              totalCharts: 0,
              activeCharts: 0,
              sharedCharts: 0,
            };

      return {
        totalDataSources: dataResult.totalDataSources,
        totalRecords: dataResult.totalRecords,
        activeCharts: chartResult.activeCharts,
        sharedCharts: chartResult.sharedCharts,
        csvSources: dataResult.csvSources,
        reportSources: dataResult.reportSources,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  // Data Source Management
  async createDataSource(data: CreateDataSourceDto, user: any) {
    try {
      const { id: userId, entity } = user;

      const existingDataSource = await this.dataSourceRepository.findOne({
        name: data.name,
        entity,
      });

      if (existingDataSource) {
        throw new BadRequestException('Data source name already exists');
      }

      const dataSourceData = {
        ...data,
        entity,
        createdBy: userId,
        updatedBy: userId,
        status: data.status || DataSourceStatus.PROCESSING,
        rowCount: data.rowCount || 0,
        columns: data.columns?.map((column) => ({
          ...column,
          nullable: column.nullable ?? true, // Ensure nullable is set
        })),
      };

      const dataSource = await this.dataSourceRepository.create(
        dataSourceData as any,
      );
      return await this.dataSourceRepository.save(dataSource);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async importCsvFile(file: Express.Multer.File, importDto: any, user: any) {
    try {
      const { id: userId, entity } = user;

      if (!file || !file.buffer) {
        throw new BadRequestException(
          'No file provided or file buffer is empty',
        );
      }

      const processedData = await this.fileProcessingService.processCsvFile(
        file,
        importDto,
      );

      const dataSourceData = {
        name: importDto.name,
        description: importDto.description,
        type: DataSourceType.CSV_IMPORT,
        fileName: importDto.fileName,
        filePath: `uploads/csv/${entity}/${Date.now()}_${importDto.fileName}`,
        entity,
        columns: importDto.columnMappings.map((column) => ({
          ...column,
          nullable: column.nullable ?? true,
        })),
        rowCount: processedData.rowCount,
        status: DataSourceStatus.READY,
        metadata: {
          hasHeader: importDto.hasHeader,
          delimiter: importDto.delimiter,
          originalSize: file.size,
          processedAt: new Date(),
        },
        preview: processedData.preview,
        createdBy: userId,
        updatedBy: userId,
      };

      const dataSource = await this.dataSourceRepository.create(
        dataSourceData as any,
      );
      return await this.dataSourceRepository.save(dataSource);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async createDataSourceFromReport(
    data: CreateDataSourceFromReportDto,
    user: any,
  ) {
    try {
      const { id: userId, entity } = user;

      // Validate report exists and user has access
      const report = await this.reportsService.getReportById(
        data.reportId.toString(),
        user,
      );

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      // Extract data from report responses
      const reportData = await this.dataAnalysisService.extractReportData(
        report,
        data.selectedFields,
        data.dateRange,
      );

      const dataSourceData = {
        name: data.name,
        description: data.description,
        type: DataSourceType.REPORT_RESPONSE,
        reportId: data.reportId,
        entity,
        columns: reportData.columns.map((column) => ({
          ...column,
          nullable: column.nullable ?? true,
          unique: false, // Set default unique property
        })),
        rowCount: reportData.rowCount,
        status: DataSourceStatus.READY,
        metadata: {
          reportTitle: report.title,
          selectedFields: data.selectedFields,
          dateRange: data.dateRange,
        },
        preview: reportData.preview,
        createdBy: userId,
        updatedBy: userId,
      };

      const dataSource = await this.dataSourceRepository.create(
        dataSourceData as any,
      );
      return await this.dataSourceRepository.save(dataSource);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async findAllDataSources(user: any, type?: string) {
    try {
      const { entity } = user;

      if (type) {
        return await this.dataSourceRepository.findByType(entity, type);
      }

      return await this.dataSourceRepository.findByEntity(entity);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getDataSourceById(id: string, user: any) {
    try {
      const { entity } = user;

      const dataSource = await this.dataSourceRepository.findById(id);

      if (!dataSource || dataSource.entity.toString() !== entity.toString()) {
        throw new NotFoundException('Data source not found');
      }

      return dataSource;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async previewDataSource(id: string, user: any, limit = 100) {
    try {
      const dataSource = await this.getDataSourceById(id, user);

      if (dataSource.type === DataSourceType.CSV_IMPORT) {
        return await this.fileProcessingService.previewCsvData(
          dataSource.filePath!,
          limit,
        );
      } else if (dataSource.type === DataSourceType.REPORT_RESPONSE) {
        return await this.dataAnalysisService.previewReportData(
          dataSource.reportId!.toString(),
          limit,
        );
      }

      return dataSource.preview || [];
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateDataSource(id: string, data: UpdateDataSourceDto, user: any) {
    try {
      const { entity, id: userId } = user;

      if (data.name) {
        const existingDataSource = await this.dataSourceRepository.findOne({
          name: data.name,
          entity,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingDataSource) {
          throw new BadRequestException('Data source name already exists');
        }
      }

      const updateData = { ...data, updatedBy: userId };

      const updatedDataSource =
        await this.dataSourceRepository.findOneAndUpdate(
          { _id: new Types.ObjectId(id), entity },
          updateData,
        );

      if (!updatedDataSource) {
        throw new NotFoundException('Data source not found');
      }

      return updatedDataSource;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async deleteDataSource(id: string, user: any) {
    try {
      const { entity } = user;

      // Check if data source exists
      const existingDataSource = await this.dataSourceRepository.findOne({
        _id: id,
        entity,
      });

      if (!existingDataSource) {
        throw new NotFoundException('Data source not found');
      }

      // Delete associated charts
      await this.chartRepository.deleteByDataSource(id);

      // Delete data source
      const result = await this.dataSourceRepository.findOneAndDelete({
        _id: id,
        entity,
      });

      if (!result.status) {
        throw new NotFoundException('Data source not found');
      }

      return { message: 'Data source deleted successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async generateSampleCsv(): Promise<string> {
    try {
      return this.fileProcessingService.generateSampleCsv();
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  // Chart Management
  async createChart(data: CreateChartDto, user: any) {
    try {
      const { id: userId, entity } = user;

      // Validate data source exists and user has access
      const dataSource = await this.getDataSourceById(
        data.dataSourceId.toString(),
        user,
      );

      // Validate chart configuration
      this.validateChartConfiguration(data, dataSource);

      const chartData = {
        ...data,
        entity,
        createdBy: userId,
        updatedBy: userId,
        status: data.status || ChartStatus.DRAFT,
        isShared: data.isShared || false,
      };

      const chart = await this.chartRepository.create(chartData as any);
      return await this.chartRepository.save(chart);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async findAllCharts(
    pagination: { pageSize: number; currentPage: number },
    filters: { status?: string; type?: string; search?: string },
    user: any,
  ) {
    try {
      const { entity } = user;
      const query: any = { entity };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.type) {
        query.type = filters.type;
      }

      // Handle search
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const populateOptions = [
        {
          path: 'dataSourceId',
          select: 'name type status',
        },
        {
          path: 'createdBy',
          select: 'firstName lastName username email',
        },
      ];

      const charts = await this.chartRepository.findPaginated(
        pagination.pageSize,
        pagination.currentPage,
        query,
        populateOptions,
      );

      return charts;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getChartById(id: string, user: any) {
    try {
      const { entity } = user;

      const chart = await this.chartRepository.findById(id, [
        {
          path: 'dataSourceId',
          select: 'name type columns status',
        },
      ]);

      if (!chart || chart.entity.toString() !== entity.toString()) {
        throw new NotFoundException('Chart not found');
      }

      return chart;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async generateChartData(id: string, user: any) {
    try {
      const chart = await this.getChartById(id, user);
      const dataSource = await this.getDataSourceById(
        chart.dataSourceId.toString(),
        user,
      );

      return await this.dataAnalysisService.generateChartData(
        chart,
        dataSource,
      );
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateChart(id: string, data: UpdateChartDto, user: any) {
    try {
      const { entity, id: userId } = user;

      if (data.name) {
        const existingChart = await this.chartRepository.findOne({
          name: data.name,
          entity,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingChart) {
          throw new BadRequestException('Chart name already exists');
        }
      }

      const updateData = { ...data, updatedBy: userId };

      const updatedChart = await this.chartRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), entity },
        updateData,
      );

      if (!updatedChart) {
        throw new NotFoundException('Chart not found');
      }

      return updatedChart;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async duplicateChart(id: string, user: any) {
    try {
      const originalChart = await this.getChartById(id, user);
      const { entity, id: userId } = user;

      const duplicateData = {
        name: `${originalChart.name} (Copy)`,
        description: originalChart.description,
        type: originalChart.type,
        dataSourceId: originalChart.dataSourceId,
        entity,
        xAxis: originalChart.xAxis,
        yAxis: originalChart.yAxis,
        groupBy: originalChart.groupBy,
        aggregation: originalChart.aggregation,
        filters: originalChart.filters,
        styling: originalChart.styling,
        status: ChartStatus.DRAFT,
        isShared: false,
        createdBy: userId,
        updatedBy: userId,
      };

      const duplicatedChart = await this.chartRepository.create(duplicateData);
      return await this.chartRepository.save(duplicatedChart);
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async shareChart(id: string, user: any) {
    try {
      const { entity, id: userId } = user;
      const chart = await this.getChartById(id, user);

      let shareToken = chart.shareToken;
      if (!shareToken) {
        shareToken = uuidv4();
      }

      const updatedChart = await this.chartRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), entity },
        {
          isShared: true,
          shareToken,
          updatedBy: userId,
        },
      );

      return {
        shareToken,
        shareUrl: `${process.env.FRONTEND_URL}/visualizations/public/${shareToken}`,
        chart: updatedChart,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async exportChart(id: string, format: string, user: any) {
    try {
      const chart = await this.getChartById(id, user);
      const chartData = await this.generateChartData(id, user);

      return await this.dataAnalysisService.exportChartData(
        chart,
        chartData,
        format,
      );
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async deleteChart(id: string, user: any) {
    try {
      const { entity } = user;

      const existingChart = await this.chartRepository.findOne({
        _id: id,
        entity,
      });

      if (!existingChart) {
        throw new NotFoundException('Chart not found');
      }

      const result = await this.chartRepository.findOneAndDelete({
        _id: id,
        entity,
      });

      if (!result.status) {
        throw new NotFoundException('Chart not found');
      }

      return { message: 'Chart deleted successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  // Reports Integration
  async getAvailableReports(user: any) {
    try {
      const reports = await this.reportsService.findAllReports(
        { pageSize: 100, currentPage: 1 },
        { status: 'published' },
        user,
      );

      return reports.data.map((report) => ({
        _id: report._id,
        title: report.title,
        description: report.description,
        responseCount: report.responseCount,
        questions: report.questions?.map((q) => ({
          id: q.id,
          title: q.title,
          type: q.type,
        })),
      }));
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getReportFields(reportId: string, user: any) {
    try {
      const report = await this.reportsService.getReportById(reportId, user);

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      const validQuestions = (report.questions || []).filter(
        (question: any) => question && question.id && question.title,
      );

      const fields = validQuestions.map((question: any) => ({
        name: question.id,
        displayName: question.title,
        type: this.mapQuestionTypeToDataType(question.type),
        required: question.required || false,
      }));

      return {
        reportId: report._id,
        reportTitle: report.title,
        fields: fields,
        responseCount: report.responseCount || 0,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  // Public Methods
  async getSharedChart(shareToken: string) {
    try {
      const chart = await this.chartRepository.findByShareToken(shareToken);

      if (!chart) {
        throw new NotFoundException('Shared chart not found');
      }

      return chart;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getSharedChartData(shareToken: string) {
    try {
      const chart = await this.getSharedChart(shareToken);
      return await this.dataAnalysisService.generateChartData(
        chart,
        chart.dataSourceId,
      );
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  // Helper Methods
  private validateChartConfiguration(
    chartData: CreateChartDto,
    dataSource: any,
  ) {
    // Validate required axes based on chart type
    const requiredAxes = this.getRequiredAxes(chartData.type);

    if (requiredAxes.includes('x') && !chartData.xAxis) {
      throw new BadRequestException('X-axis is required for this chart type');
    }

    if (requiredAxes.includes('y') && !chartData.yAxis) {
      throw new BadRequestException('Y-axis is required for this chart type');
    }

    // Validate columns exist in data source
    const columnNames = dataSource.columns.map((col: any) => col.name);

    if (chartData.xAxis && !columnNames.includes(chartData.xAxis)) {
      throw new BadRequestException('X-axis column not found in data source');
    }

    if (chartData.yAxis && !columnNames.includes(chartData.yAxis)) {
      throw new BadRequestException('Y-axis column not found in data source');
    }
  }

  private getRequiredAxes(chartType: ChartType): string[] {
    switch (chartType) {
      case ChartType.BAR:
      case ChartType.LINE:
      case ChartType.AREA:
      case ChartType.SCATTER:
        return ['x', 'y'];
      case ChartType.PIE:
      case ChartType.DOUGHNUT:
        return ['groupBy'];
      default:
        return [];
    }
  }

  private mapQuestionTypeToDataType(questionType: string): string {
    // Map question types to data types
    switch (questionType) {
      case 'linear_scale':
      case 'multiple_choice':
        return 'number';
      case 'date':
        return 'date';
      case 'checkboxes':
        return 'boolean';
      default:
        return 'string';
    }
  }
}
