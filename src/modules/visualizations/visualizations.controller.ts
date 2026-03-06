import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  Delete,
  Put,
  Request,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VisualizationsService } from './visualizations.service';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { CreateChartDto } from './dto/create-chart.dto';
import { UpdateChartDto } from './dto/update-chart.dto';
import { CreateDataSourceFromReportDto } from './dto/report-integration.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { File as MulterFile } from 'multer';

@Controller('visualizations')
@UseGuards(JwtAuthGuard)
export class VisualizationsController {
  constructor(private readonly visualizationsService: VisualizationsService) {}

  @Get('dashboard')
  async getDashboardStats(@Request() req) {
    try {
      const stats = await this.visualizationsService.getDashboardStats(
        req.user,
      );
      return stats;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get dashboard stats',
      );
    }
  }

  @Post('data-sources/create')
  async createDataSource(
    @Body() dataSourceDto: CreateDataSourceDto,
    @Request() req,
  ) {
    try {
      const dataSource = await this.visualizationsService.createDataSource(
        dataSourceDto,
        req.user,
      );
      return dataSource;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to create data source',
      );
    }
  }

  @Post('data-sources/import-csv')
  @UseInterceptors(AnyFilesInterceptor())
  async importCsvFile(
    @Body() body: any,
    @UploadedFiles() files: MulterFile[],
    @Request() req,
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No file uploaded');
      }

      const file = files[0];
      const parsedDto = this.parseFormDataForCsvImport(body);
      return await this.visualizationsService.importCsvFile(
        file,
        parsedDto,
        req.user,
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to import CSV file',
      );
    }
  }

  @Post('data-sources/from-report')
  async createDataSourceFromReport(
    @Body() reportDto: CreateDataSourceFromReportDto,
    @Request() req,
  ) {
    try {
      const dataSource =
        await this.visualizationsService.createDataSourceFromReport(
          reportDto,
          req.user,
        );
      return dataSource;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to create data source from report',
      );
    }
  }

  @Get('data-sources/all')
  async findAllDataSources(@Query('type') type: string, @Request() req) {
    try {
      const dataSources = await this.visualizationsService.findAllDataSources(
        req.user,
        type,
      );
      return dataSources;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get data sources',
      );
    }
  }

  @Get('data-sources/sample-csv')
  async downloadSampleCsv(@Res() res: Response) {
    try {
      const csvContent = await this.visualizationsService.generateSampleCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="sample_data.csv"',
      );
      res.send(csvContent);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to generate sample CSV',
      );
    }
  }

  @Get('data-sources/:id')
  async getDataSourceDetails(@Param('id') id: string, @Request() req) {
    try {
      const dataSource = await this.visualizationsService.getDataSourceById(
        id,
        req.user,
      );
      return dataSource;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get data source',
      );
    }
  }

  @Get('data-sources/:id/preview')
  async previewDataSource(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    try {
      const preview = await this.visualizationsService.previewDataSource(
        id,
        req.user,
        parseInt(limit, 10) || 100,
      );
      return preview;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to preview data source',
      );
    }
  }

  @Put('data-sources/:id')
  async updateDataSource(
    @Param('id') id: string,
    @Body() updateData: UpdateDataSourceDto,
    @Request() req,
  ) {
    try {
      const updatedDataSource =
        await this.visualizationsService.updateDataSource(
          id,
          updateData,
          req.user,
        );
      return updatedDataSource;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to update data source',
      );
    }
  }

  @Delete('data-sources/:id')
  async deleteDataSource(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.visualizationsService.deleteDataSource(
        id,
        req.user,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to delete data source',
      );
    }
  }

  @Post('charts/create')
  async createChart(@Body() chartDto: CreateChartDto, @Request() req) {
    try {
      const chart = await this.visualizationsService.createChart(
        chartDto,
        req.user,
      );
      return chart;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create chart');
    }
  }

  @Get('charts/all')
  async findAllCharts(
    @Query('pageSize') pageSize: string,
    @Query('currentPage') currentPage: string,
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('search') search: string,
    @Request() req,
  ) {
    try {
      const paginationParams = {
        pageSize: parseInt(pageSize, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
      };
      const filters = { status, type, search };
      const charts = await this.visualizationsService.findAllCharts(
        paginationParams,
        filters,
        req.user,
      );
      return charts;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get charts');
    }
  }

  @Get('charts/:id')
  async getChartDetails(@Param('id') id: string, @Request() req) {
    try {
      const chart = await this.visualizationsService.getChartById(id, req.user);
      return chart;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get chart');
    }
  }

  @Get('charts/:id/data')
  async generateChartData(@Param('id') id: string, @Request() req) {
    try {
      const chartData = await this.visualizationsService.generateChartData(
        id,
        req.user,
      );
      return chartData;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to generate chart data',
      );
    }
  }

  @Put('charts/:id')
  async updateChart(
    @Param('id') id: string,
    @Body() updateData: UpdateChartDto,
    @Request() req,
  ) {
    try {
      const updatedChart = await this.visualizationsService.updateChart(
        id,
        updateData,
        req.user,
      );
      return updatedChart;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update chart');
    }
  }

  @Post('charts/:id/duplicate')
  async duplicateChart(@Param('id') id: string, @Request() req) {
    try {
      const duplicatedChart = await this.visualizationsService.duplicateChart(
        id,
        req.user,
      );
      return duplicatedChart;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to duplicate chart',
      );
    }
  }

  @Post('charts/:id/share')
  async shareChart(@Param('id') id: string, @Request() req) {
    try {
      const shareInfo = await this.visualizationsService.shareChart(
        id,
        req.user,
      );
      return shareInfo;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to share chart');
    }
  }

  @Get('charts/:id/export')
  async exportChart(
    @Param('id') id: string,
    @Query('format') format: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const exportData = await this.visualizationsService.exportChart(
        id,
        format || 'json',
        req.user,
      );
      const filename = `chart_${id}.${format || 'json'}`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(exportData);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to export chart');
    }
  }

  @Delete('charts/:id')
  async deleteChart(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.visualizationsService.deleteChart(id, req.user);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete chart');
    }
  }

  @Get('reports/available')
  async getAvailableReports(@Request() req) {
    try {
      const reports = await this.visualizationsService.getAvailableReports(
        req.user,
      );
      return reports;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get available reports',
      );
    }
  }

  @Get('reports/:id/fields')
  async getReportFields(@Param('id') id: string, @Request() req) {
    try {
      const fields = await this.visualizationsService.getReportFields(
        id,
        req.user,
      );
      return fields;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get report fields',
      );
    }
  }

  @Get('public/charts/:shareToken')
  async getSharedChart(@Param('shareToken') shareToken: string) {
    try {
      const chart = await this.visualizationsService.getSharedChart(shareToken);
      return chart;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get shared chart',
      );
    }
  }

  @Get('public/charts/:shareToken/data')
  async getSharedChartData(@Param('shareToken') shareToken: string) {
    try {
      const chartData = await this.visualizationsService.getSharedChartData(
        shareToken,
      );
      return chartData;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to get shared chart data',
      );
    }
  }

  private parseFormDataForCsvImport(body: any) {
    try {
      const columnMappings = body.columnMappings
        ? JSON.parse(body.columnMappings)
        : [];

      return {
        name: body.name,
        description: body.description || '',
        fileName: body.fileName,
        hasHeader: body.hasHeader === 'true',
        delimiter: body.delimiter || ',',
        columnMappings: columnMappings,
      };
    } catch (error) {
      throw new BadRequestException('Invalid form data format');
    }
  }
}
