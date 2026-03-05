/* eslint-disable @typescript-eslint/no-unused-vars */
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { PaginatedData } from '../common/types/types';

export abstract class AbstractRepo<T> {
  constructor(public readonly model: Model<T>) {}

  async save(entity: T): Promise<T> {
    const savedEntity = await this.model.create(entity);
    await savedEntity.save();
    return savedEntity;
  }

  public async create(entity: Partial<T>): Promise<T> {
    return this.model.create(entity as any);
  }

  async aggregate(pipeline: any[]) {
    return this.model.aggregate(pipeline).exec();
  }

  async exists(where: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(where);
    return count > 0;
  }

  async findOne(where: FilterQuery<T>, select?: string): Promise<T | null> {
    const entity = await this.model.findOne(where, select).exec();
    return entity;
  }

  async findById(
    id: string | Types.ObjectId,
    options?: any,
  ): Promise<T | null> {
    let query = this.model.findById(id);

    if (options?.populate) {
      query = query.populate(options.populate);
    }

    if (options?.select) {
      query = query.select(options.select);
    }

    return query.exec();
  }

  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    update: UpdateQuery<T>,
    options: any = { new: true },
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update, options)
      .exec() as Promise<T | null>;
  }

  async findByIdAndDelete(id: string | Types.ObjectId): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async findOneAndUpdate(
    where: FilterQuery<T>,
    partialEntity: UpdateQuery<T>,
    options: any = { new: true },
  ): Promise<T | null> {
    const updatedEntity = await this.model
      .findOneAndUpdate(where, partialEntity, options)
      .exec();
    if (!updatedEntity) {
      console.warn('Entity not found with where', where);
      return null;
    }
    return updatedEntity as unknown as T;
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: any,
  ): Promise<{
    acknowledged: boolean;
    modifiedCount: number;
    matchedCount: number;
  }> {
    return this.model.updateMany(filter, update, options).exec();
  }

  async findPaginated(
    pageSize = 10,
    currentPage = 1,
    where: FilterQuery<T> = {},
    relation?: any,
  ): Promise<{
    data: T[];
    pagination: PaginatedData;
    nextPage?: number;
    previousPage?: number;
  }> {
    const offset = (currentPage - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.model
        .find(where)
        .sort({ _id: -1 })
        .limit(pageSize)
        .skip(offset)
        .populate(relation)
        .exec(),
      this.model.countDocuments(where),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = currentPage < totalPages;
    const nextPage = hasNextPage ? currentPage + 1 : undefined;
    const hasPreviousPage = currentPage > 1;
    const previousPage = hasPreviousPage ? currentPage - 1 : undefined;

    return {
      data,
      pagination: {
        total,
        pageSize,
        currentPage,
        totalPages,
        hasNextPage,
        nextPage,
        hasPreviousPage,
        previousPage,
      },
    };
  }

  async find(
    where: FilterQuery<T> = {},
    select?: string,
    order: Record<string, any> = {},
  ): Promise<T[]> {
    return this.model.find(where, select).sort(order).exec();
  }

  async findOneByRole(role: string): Promise<T | null> {
    return this.model.findOne({ role } as any).exec();
  }

  async findOneAndDelete(where: FilterQuery<T>): Promise<{ status: boolean }> {
    const res = await this.model.deleteOne(where).exec();
    return {
      status: res.deletedCount > 0,
    };
  }

  async deleteMany(filter: FilterQuery<T>): Promise<any> {
    return this.model.deleteMany(filter).exec();
  }

  async count(where: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(where, { maxTimeMS: 30000 });
  }

  async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter, { maxTimeMS: 30000 });
  }
}
