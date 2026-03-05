import { Injectable } from '@nestjs/common';
import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import { OrganizationModel, Organization } from '../model/organization.model';

@Injectable()
export class OrganizationRepository extends AbstractRepo<Organization> {
  constructor() {
    super(OrganizationModel);
  }

  async findByDomain(domain: string): Promise<Organization | null> {
    return this.findOne({
      $or: [
        { domain: domain.toLowerCase() },
        { allowedDomains: { $in: [domain.toLowerCase()] } },
      ],
    });
  }

  async findActiveOrganizations(): Promise<Organization[]> {
    return this.find({ status: { $in: ['active', 'trial'] } });
  }
}
