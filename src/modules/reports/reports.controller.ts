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
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-reports.dto';
import { UpdateReportDto } from './dto/update-reports.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ShareReportDto } from './dto/share-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createReport(@Body() reportDto: CreateReportDto, @Request() req) {
    try {
      const user = req.user;
      const createdReport = await this.reportsService.createReport(
        reportDto,
        user,
      );
      return createdReport;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async findAllReports(
    @Query('pageSize') pageSize: string,
    @Query('currentPage') currentPage: string,
    @Query('status') status: string,
    @Query('category') category: string,
    @Query('search') search: string,
    @Request() req,
  ) {
    try {
      const paginationParams = {
        pageSize: parseInt(pageSize, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
      };

      const filters = { status, category, search };

      const reports = await this.reportsService.findAllReports(
        paginationParams,
        filters,
        req.user,
      );
      return reports;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req) {
    try {
      const stats = await this.reportsService.getDashboardStats(req.user);
      return stats;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('with-metrics-summary')
  @UseGuards(JwtAuthGuard)
  async getReportsWithMetricsSummary(@Request() req) {
    try {
      const reports = await this.reportsService.getReportsWithMetricsSummary(
        req.user,
      );
      return reports;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('details/:id')
  @UseGuards(JwtAuthGuard)
  async getReportDetails(@Param('id') id: string, @Request() req) {
    try {
      const report = await this.reportsService.getReportById(id, req.user);
      return report;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('public/:shareToken')
  async getPublicReport(@Param('shareToken') shareToken: string) {
    try {
      const report = await this.reportsService.getReportByShareToken(
        shareToken,
      );
      return report;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  async updateReport(
    @Param('id') id: string,
    @Body() updateData: UpdateReportDto,
    @Request() req,
  ) {
    try {
      const updatedReport = await this.reportsService.updateReport(
        id,
        updateData,
        req.user,
      );
      return updatedReport;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateReportStatus(
    @Param('id') id: string,
    @Body() statusData: { status: string },
    @Request() req,
  ) {
    try {
      const updatedReport = await this.reportsService.updateStatus(
        id,
        statusData.status,
        req.user,
      );
      return updatedReport;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishReport(@Param('id') id: string, @Request() req) {
    try {
      const publishedReport = await this.reportsService.publishReport(
        id,
        req.user,
      );
      return publishedReport;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  async duplicateReport(@Param('id') id: string, @Request() req) {
    try {
      const user = req.user;
      const duplicatedReport = await this.reportsService.duplicateReport(
        id,
        user,
      );
      return duplicatedReport;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReport(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.reportsService.deleteReport(id, req.user);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/share-link')
  @UseGuards(JwtAuthGuard)
  async getShareLink(@Param('id') id: string, @Request() req) {
    try {
      const shareLink = await this.reportsService.generateShareLink(
        id,
        req.user,
      );
      return shareLink;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/share-email')
  @UseGuards(JwtAuthGuard)
  async shareReportViaEmail(
    @Param('id') id: string,
    @Body() shareData: ShareReportDto,
    @Request() req,
  ) {
    try {
      const result = await this.reportsService.shareReportViaEmail(
        id,
        shareData,
        req.user,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
