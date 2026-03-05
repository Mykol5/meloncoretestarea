import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRepository } from './repository/projects.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';
import { Types } from 'mongoose';
import { ProjectStatus } from 'src/libs/constants';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject('PROJECT_REPOSITORY')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async createProject(data: CreateProjectDto, user: any) {
    try {
      const { sub: userId, organizationId } = user;

      const existingProject = await this.projectRepository.findOne({
        title: data.title,
        organization: organizationId,
      });

      if (existingProject) {
        throw new BadRequestException(
          'Project title already exists for this organization',
        );
      }

      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new BadRequestException('End date must be after start date');
      }

      const attachments = (data.attachments || []).map((attachment) => ({
        ...attachment,
        uploadedAt: new Date(),
      }));

      const projectData = {
        ...data,
        organization: organizationId,
        createdBy: userId,
        updatedBy: userId,
        status: data.status || ProjectStatus.DRAFT,
        spentBudget: data.spentBudget || 0,
        actualHouseholds: data.actualHouseholds || 0,
        progressPercentage: data.progressPercentage || 0,
        impactScore: data.impactScore || 0,
        teamMembers: data.teamMembers || [],
        tags: data.tags || [],
        attachments,
        objectives: data.objectives || [],
        expectedOutcomes: data.expectedOutcomes || [],
        risks: data.risks || [],
        isActive: data.isActive ?? true,
      };

      const project = await this.projectRepository.create(projectData);
      return project;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getProjectById(id: string, user?: any) {
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

      const project = await this.projectRepository.findById(id, {
        populate: populateOptions,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (
        user &&
        project.organization.toString() !== user.organizationId.toString()
      ) {
        throw new NotFoundException('Project not found');
      }

      return project;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async findAllProjects(
    pagination: { pageSize: number; currentPage: number },
    filters: {
      status?: string;
      sector?: string;
      region?: string;
      search?: string;
    },
    user: any,
  ) {
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

      const projects = await this.projectRepository.findPaginated(
        pagination.pageSize,
        pagination.currentPage,
        {
          organization: organizationId,
          ...(filters.status && { status: filters.status }),
          ...(filters.sector && { sector: filters.sector }),
          ...(filters.region && { region: filters.region }),
          ...(filters.search && {
            $or: [
              { title: { $regex: filters.search, $options: 'i' } },
              { description: { $regex: filters.search, $options: 'i' } },
            ],
          }),
        },
        populateOptions,
      );

      return projects;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getDashboardStats(user: any) {
    try {
      const { organizationId } = user;

      const stats = await this.projectRepository.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: {
                $cond: [{ $eq: ['$status', ProjectStatus.ACTIVE] }, 1, 0],
              },
            },
            draftProjects: {
              $sum: {
                $cond: [{ $eq: ['$status', ProjectStatus.DRAFT] }, 1, 0],
              },
            },
            completedProjects: {
              $sum: {
                $cond: [{ $eq: ['$status', ProjectStatus.COMPLETED] }, 1, 0],
              },
            },
            totalBudget: { $sum: '$totalBudget' },
            totalSpent: { $sum: '$spentBudget' },
            totalHouseholds: { $sum: '$actualHouseholds' },
            totalCoverage: { $sum: '$coverageArea' },
            avgImpactScore: { $avg: '$impactScore' },
            avgProgress: { $avg: '$progressPercentage' },
          },
        },
      ]);

      const result =
        stats.length > 0
          ? stats[0]
          : {
              totalProjects: 0,
              activeProjects: 0,
              draftProjects: 0,
              completedProjects: 0,
              totalBudget: 0,
              totalSpent: 0,
              totalHouseholds: 0,
              totalCoverage: 0,
              avgImpactScore: 0,
              avgProgress: 0,
            };

      return {
        totalProjects: result.totalProjects,
        activeProjects: result.activeProjects,
        totalReach: `${Math.round(result.totalHouseholds / 1000)}K`,
        coverageArea: `${(result.totalCoverage / 1000).toFixed(1)}K`,
        avgImpactScore: `${Math.round(result.avgImpactScore || 0)}%`,
        budgetUtilization:
          result.totalBudget > 0
            ? `${Math.round((result.totalSpent / result.totalBudget) * 100)}%`
            : '0%',
        avgProgress: Math.round(result.avgProgress || 0),
        draftProjects: result.draftProjects,
        completedProjects: result.completedProjects,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateProject(id: string, dto: UpdateProjectDto, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      if (dto.title) {
        const existingProject = await this.projectRepository.findOne({
          title: dto.title,
          organization: organizationId,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingProject) {
          throw new BadRequestException(
            'Project title already exists for this organization',
          );
        }
      }

      if (dto.startDate && dto.endDate) {
        if (new Date(dto.startDate) >= new Date(dto.endDate)) {
          throw new BadRequestException('End date must be after start date');
        }
      }

      const updateData: any = { ...dto, updatedBy: userId };

      const updatedProject = await this.projectRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        updateData,
      );

      if (!updatedProject) {
        throw new NotFoundException('Project not found');
      }

      return updatedProject;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateStatus(id: string, status: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      const updatedProject = await this.projectRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        { status, updatedBy: userId },
      );

      if (!updatedProject) {
        throw new NotFoundException('Project not found');
      }

      return updatedProject;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async duplicateProject(id: string, user: any) {
    try {
      const originalProject = await this.getProjectById(id, user);
      const { organizationId, sub: userId } = user;

      const duplicateData = {
        title: `${originalProject.title} (Copy)`,
        description: originalProject.description,
        sector: originalProject.sector,
        region: originalProject.region,
        organization: organizationId,
        createdBy: userId,
        updatedBy: userId,
        status: ProjectStatus.DRAFT,
        priority: originalProject.priority,
        startDate: originalProject.startDate,
        endDate: originalProject.endDate,
        totalBudget: originalProject.totalBudget,
        spentBudget: 0,
        targetHouseholds: originalProject.targetHouseholds,
        actualHouseholds: 0,
        coverageArea: originalProject.coverageArea,
        fundingSource: originalProject.fundingSource,
        teamMembers: originalProject.teamMembers,
        tags: originalProject.tags,
        attachments: [],
        progressPercentage: 0,
        impactScore: 0,
        location: originalProject.location,
        objectives: originalProject.objectives,
        expectedOutcomes: originalProject.expectedOutcomes,
        risks: originalProject.risks,
        notes: originalProject.notes,
        isActive: true,
      };

      const duplicatedProject = await this.projectRepository.create(
        duplicateData,
      );
      return duplicatedProject;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async deleteProject(id: string, user: any) {
    try {
      const { organizationId } = user;

      const existingProject = await this.projectRepository.findOne({
        _id: id,
        organization: organizationId,
      });

      if (!existingProject) {
        throw new NotFoundException('Project not found');
      }

      const result = await this.projectRepository.findOneAndDelete({
        _id: id,
        organization: organizationId,
      });

      if (!result.status) {
        throw new NotFoundException('Project not found');
      }

      return { message: 'Project deleted successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getProjectSummaryWithMetrics(user: any) {
    try {
      const { organizationId } = user;

      const projects = await this.projectRepository.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: '$_id',
            title: { $first: '$title' },
            status: { $first: '$status' },
            sector: { $first: '$sector' },
            region: { $first: '$region' },
            createdAt: { $first: '$createdAt' },
            progressPercentage: { $first: '$progressPercentage' },
            impactScore: { $first: '$impactScore' },
            totalBudget: { $first: '$totalBudget' },
            spentBudget: { $first: '$spentBudget' },
            actualHouseholds: { $first: '$actualHouseholds' },
            coverageArea: { $first: '$coverageArea' },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return projects;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getProjectStats(user: any) {
    try {
      const { organizationId } = user;

      const stats = await this.projectRepository.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: {
                $cond: [{ $eq: ['$status', ProjectStatus.ACTIVE] }, 1, 0],
              },
            },
            totalBeneficiaries: { $sum: '$actualHouseholds' },
          },
        },
      ]);

      const result =
        stats.length > 0
          ? stats[0]
          : {
              totalProjects: 0,
              activeProjects: 0,
              totalBeneficiaries: 0,
            };

      return {
        totalProjects: result.totalProjects,
        activeProjects: result.activeProjects,
        totalBeneficiaries: result.totalBeneficiaries,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getRegionalStats(organizationId: string) {
    try {
      const stats = await this.projectRepository.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: '$region',
            projects: { $sum: 1 },
            beneficiaries: { $sum: '$actualHouseholds' },
            totalCoverage: { $sum: '$coverageArea' },
          },
        },
        { $sort: { projects: -1 } },
      ]);

      return stats.map((stat) => {
        const formatNumber = (num: number): string => {
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toString();
        };

        const coverage =
          stat.totalCoverage > 0
            ? Math.round((stat.beneficiaries / stat.totalCoverage) * 100)
            : 0;

        return {
          region: stat._id || 'Unspecified Region',
          projects: stat.projects,
          beneficiaries: formatNumber(stat.beneficiaries),
          coverage: Math.min(coverage, 100),
        };
      });
    } catch (error) {
      handleErrorCatch(error);
    }
  }
}
