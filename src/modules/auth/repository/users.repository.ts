import { Injectable } from '@nestjs/common';
import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import { UserModel, User } from '../model/users.model';

@Injectable()
export class UserRepository extends AbstractRepo<User> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByOrganization(organizationId: string): Promise<User[]> {
    return this.find({ organization: organizationId });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return this.model.countDocuments({ organization: organizationId });
  }
}
