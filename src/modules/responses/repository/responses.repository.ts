import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import ResponsesModel, { Response } from '../model/responses.model';

export class ResponsesRepository extends AbstractRepo<Response> {
  constructor() {
    super(ResponsesModel.model);
  }

  async findAll(): Promise<Response[]> {
    return ResponsesModel.model.find().exec();
  }
}
