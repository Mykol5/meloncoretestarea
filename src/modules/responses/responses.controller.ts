import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
  Ip,
  Headers,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post('submit')
  async submitResponse(
    @Body() responseDto: CreateResponseDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    try {
      const result = await this.responsesService.submitResponse(
        responseDto,
        ipAddress,
        userAgent,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('report/:reportId')
  @UseGuards(JwtAuthGuard)
  async getResponsesByReport(
    @Param('reportId') reportId: string,
    @Query('pageSize') pageSize: string,
    @Query('currentPage') currentPage: string,
    @Request() req,
  ) {
    try {
      const paginationParams = {
        pageSize: parseInt(pageSize, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
      };

      const responses = await this.responsesService.getResponsesByReport(
        reportId,
        paginationParams,
        req.user,
      );
      return responses;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('details/:responseId')
  @UseGuards(JwtAuthGuard)
  async getResponseDetails(
    @Param('responseId') responseId: string,
    @Request() req,
  ) {
    try {
      const response = await this.responsesService.getResponseById(
        responseId,
        req.user,
      );
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('analytics/:reportId')
  @UseGuards(JwtAuthGuard)
  async getResponseAnalytics(
    @Param('reportId') reportId: string,
    @Request() req,
  ) {
    try {
      const analytics = await this.responsesService.getResponseAnalytics(
        reportId,
        req.user,
      );
      return analytics;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('impact-metrics-progress/:reportId')
  @UseGuards(JwtAuthGuard)
  async getImpactMetricsProgress(
    @Param('reportId') reportId: string,
    @Request() req,
  ) {
    try {
      const progress = await this.responsesService.getImpactMetricsProgress(
        reportId,
        req.user,
      );
      return progress;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
