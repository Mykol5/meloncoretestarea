import { Injectable } from '@nestjs/common';
import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import { ProjectModel, Project } from '../model/projects.model';

@Injectable()
export class ProjectRepository extends AbstractRepo<Project> {
  constructor() {
    super(ProjectModel);
  }

  async findByOrganization(organizationId: string): Promise<Project[]> {
    return this.find({ organization: organizationId });
  }

  async findByStatus(
    status: string,
    organizationId?: string,
  ): Promise<Project[]> {
    const query: any = { status };
    if (organizationId) {
      query.organization = organizationId;
    }
    return this.find(query);
  }

  async findByOrganizationAndFilters(
    organizationId: string,
    filters: {
      status?: string;
      sector?: string;
      region?: string;
      search?: string;
    },
  ): Promise<Project[]> {
    const query: any = { organization: organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.sector) query.sector = filters.sector;
    if (filters.region) query.region = filters.region;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.find(query);
  }
}
