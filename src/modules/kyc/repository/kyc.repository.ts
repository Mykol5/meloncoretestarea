import { Injectable } from '@nestjs/common';
import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import { KYCUserModel, KYCUser } from '../model/kyc-user.model';

@Injectable()
export class KYCRepository extends AbstractRepo<KYCUser> {
  constructor() {
    super(KYCUserModel);
  }

  async findByOrganization(organizationId: string): Promise<KYCUser[]> {
    return this.find({ organization: organizationId });
  }

  async findByStatus(
    status: string,
    organizationId?: string,
  ): Promise<KYCUser[]> {
    const query: any = { status };
    if (organizationId) {
      query.organization = organizationId;
    }
    return this.find(query);
  }

  async findByEmail(
    email: string,
    organizationId: string,
  ): Promise<KYCUser | null> {
    return this.findOne({ email, organization: organizationId });
  }

  async findByOrganizationAndFilters(
    organizationId: string,
    filters: {
      status?: string;
      search?: string;
    },
  ): Promise<KYCUser[]> {
    const query: any = { organization: organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.find(query);
  }
}
