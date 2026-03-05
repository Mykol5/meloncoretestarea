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
import { PortfolioService } from './portfolio.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createProject(@Body() projectDto: CreateProjectDto, @Request() req) {
    try {
      const user = req.user;
      const createdProject = await this.portfolioService.createProject(
        projectDto,
        user,
      );
      return createdProject;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async findAllProjects(
    @Query('pageSize') pageSize: string,
    @Query('currentPage') currentPage: string,
    @Query('status') status: string,
    @Query('sector') sector: string,
    @Query('region') region: string,
    @Query('search') search: string,
    @Request() req,
  ) {
    try {
      const paginationParams = {
        pageSize: parseInt(pageSize, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
      };

      const filters = { status, sector, region, search };

      const projects = await this.portfolioService.findAllProjects(
        paginationParams,
        filters,
        req.user,
      );
      return projects;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req) {
    try {
      const stats = await this.portfolioService.getDashboardStats(req.user);
      return stats;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('summary-with-metrics')
  @UseGuards(JwtAuthGuard)
  async getProjectSummaryWithMetrics(@Request() req) {
    try {
      const projects = await this.portfolioService.getProjectSummaryWithMetrics(
        req.user,
      );
      return projects;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('details/:id')
  @UseGuards(JwtAuthGuard)
  async getProjectDetails(@Param('id') id: string, @Request() req) {
    try {
      const project = await this.portfolioService.getProjectById(id, req.user);
      return project;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  async updateProject(
    @Param('id') id: string,
    @Body() updateData: UpdateProjectDto,
    @Request() req,
  ) {
    try {
      const updatedProject = await this.portfolioService.updateProject(
        id,
        updateData,
        req.user,
      );
      return updatedProject;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateProjectStatus(
    @Param('id') id: string,
    @Body() statusData: { status: string },
    @Request() req,
  ) {
    try {
      const updatedProject = await this.portfolioService.updateStatus(
        id,
        statusData.status,
        req.user,
      );
      return updatedProject;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  async duplicateProject(@Param('id') id: string, @Request() req) {
    try {
      const user = req.user;
      const duplicatedProject = await this.portfolioService.duplicateProject(
        id,
        user,
      );
      return duplicatedProject;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteProject(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.portfolioService.deleteProject(id, req.user);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
