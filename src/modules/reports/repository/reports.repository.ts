import { Injectable } from '@nestjs/common';
import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import { ReportModel, Report } from '../model/reports.model';

@Injectable()
export class ReportsRepository extends AbstractRepo<Report> {
  constructor() {
    super(ReportModel);
  }

  async findByOrganization(organizationId: string): Promise<Report[]> {
    return this.find({ organization: organizationId });
  }

  async findPublicByShareToken(shareToken: string): Promise<Report | null> {
    return this.findOne({
      shareToken,
      isPublic: true,
    });
  }

  async findByStatus(
    status: string,
    organizationId?: string,
  ): Promise<Report[]> {
    const query: any = { status };
    if (organizationId) {
      query.organization = organizationId;
    }
    return this.find(query);
  }

  async findByOrganizationAndFilters(
    organizationId: string,
    filters: { status?: string; category?: string; search?: string },
  ): Promise<Report[]> {
    const query: any = { organization: organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.find(query);
  }
}
