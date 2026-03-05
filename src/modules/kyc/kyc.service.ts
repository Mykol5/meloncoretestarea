import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { KYCRepository } from './repository/kyc.repository';
import { CreateKYCUserDto } from './dto/create-kyc-user.dto';
import { UpdateKYCUserDto } from './dto/update-kyc-user.dto';
import { SubmitVerificationDto } from './dto/webhook.dto';
import { handleErrorCatch } from 'src/libs/common/helpers/utils';
import { Types } from 'mongoose';
import { KYCStatus } from 'src/libs/constants';
import { MobileIntegrationService } from './services/mobile-integration.service';
import { GeocodingService } from './services/geocoding.service';
import { PDFGenerationService } from './services/pdf-generation.service';

@Injectable()
export class KYCService {
  private readonly logger = new Logger(KYCService.name);

  constructor(
    @Inject('KYC_REPOSITORY')
    private readonly kycRepository: KYCRepository,
    private readonly mobileIntegrationService: MobileIntegrationService,
    private readonly geocodingService: GeocodingService,
    private readonly pdfGenerationService: PDFGenerationService,
  ) {}

  async createKYCUser(data: CreateKYCUserDto, user: any) {
    try {
      const { sub: userId, organizationId } = user;

      if (!organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      const existingEmail = await this.kycRepository.findOne({
        email: data.email.toLowerCase(),
        organization: organizationId,
      });

      if (existingEmail) {
        throw new BadRequestException('A user with this email already exists');
      }

      const isMultiAddress = data.addresses && data.addresses.length > 0;

      if (isMultiAddress) {
        return await this.createMultiAddressKYCUser(
          data,
          userId,
          organizationId,
        );
      } else {
        return await this.createSingleAddressKYCUser(
          data,
          userId,
          organizationId,
        );
      }
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getKYCUserById(id: string, user?: any) {
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
        {
          path: 'assignedAgent',
          select: 'firstName lastName username email',
        },
      ];

      const kycUser = await this.kycRepository.findById(id, {
        populate: populateOptions,
      });

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      if (
        user &&
        kycUser.organization.toString() !== user.organizationId.toString()
      ) {
        throw new NotFoundException('KYC user not found');
      }

      return kycUser;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async findAllKYCUsers(
    pagination: { pageSize: number; currentPage: number },
    filters: {
      status?: string;
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
        {
          path: 'assignedAgent',
          select: 'firstName lastName username email',
        },
      ];

      const query: any = {
        organization: organizationId,
      };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.search) {
        query.$or = [
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const kycUsers = await this.kycRepository.findPaginated(
        pagination.pageSize,
        pagination.currentPage,
        query,
        populateOptions,
      );

      return kycUsers;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async getDashboardStats(user: any) {
    try {
      const { organizationId } = user;

      const stats = await this.kycRepository.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId),
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', KYCStatus.PENDING] }, 1, 0],
              },
            },
            assigned: {
              $sum: {
                $cond: [{ $eq: ['$status', KYCStatus.ASSIGNED] }, 1, 0],
              },
            },
            inReview: {
              $sum: {
                $cond: [{ $eq: ['$status', KYCStatus.IN_REVIEW] }, 1, 0],
              },
            },
            verificationSubmitted: {
              $sum: {
                $cond: [
                  { $eq: ['$status', KYCStatus.VERIFICATION_SUBMITTED] },
                  1,
                  0,
                ],
              },
            },
            verified: {
              $sum: {
                $cond: [{ $eq: ['$status', KYCStatus.VERIFIED] }, 1, 0],
              },
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ['$status', KYCStatus.REJECTED] }, 1, 0],
              },
            },
          },
        },
      ]);

      const result =
        stats.length > 0
          ? stats[0]
          : {
              totalUsers: 0,
              pending: 0,
              assigned: 0,
              inReview: 0,
              verificationSubmitted: 0,
              verified: 0,
              rejected: 0,
            };

      return {
        totalUsers: result.totalUsers,
        pending: result.pending,
        assigned: result.assigned,
        inReview: result.inReview,
        verificationSubmitted: result.verificationSubmitted,
        verified: result.verified,
        rejected: result.rejected,
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateKYCUser(id: string, dto: UpdateKYCUserDto, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      if (dto.email) {
        const existingEmail = await this.kycRepository.findOne({
          email: dto.email.toLowerCase(),
          organization: organizationId,
          _id: { $ne: new Types.ObjectId(id) },
        });

        if (existingEmail) {
          throw new BadRequestException(
            'A user with this email already exists in your organization',
          );
        }
      }

      const updateData: any = {
        ...dto,
        updatedBy: userId,
      };

      if (dto.email) {
        updateData.email = dto.email.toLowerCase();
      }

      if (dto.status === KYCStatus.VERIFIED) {
        updateData.verificationDate = new Date();
      }

      const updatedKYCUser = await this.kycRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        updateData,
      );

      if (!updatedKYCUser) {
        throw new NotFoundException('KYC user not found');
      }

      return updatedKYCUser;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async updateStatus(id: string, status: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      const updateData: any = { status, updatedBy: userId };

      if (status === KYCStatus.VERIFIED) {
        updateData.verificationDate = new Date();
      }

      const updatedKYCUser = await this.kycRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id), organization: organizationId },
        updateData,
      );

      if (!updatedKYCUser) {
        throw new NotFoundException('KYC user not found');
      }

      return updatedKYCUser;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async handleAgentAssignment(
    webJobId: string,
    agentId: string,
    mobileJobId: string,
  ) {
    try {
      const realKycId = webJobId.includes('_')
        ? webJobId.split('_')[0]
        : webJobId;

      const kycUser = await this.kycRepository.findById(realKycId);

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      const addressIndex = kycUser.addresses?.findIndex(
        (addr) => addr.mobileJobId === mobileJobId,
      );

      if (addressIndex !== undefined && addressIndex >= 0) {
        await this.kycRepository.findByIdAndUpdate(realKycId, {
          [`addresses.${addressIndex}.status`]: KYCStatus.ASSIGNED,
          assignedAgent: agentId,
        });

        const updatedUser = await this.kycRepository.findById(realKycId);
        const overallStatus = this.calculateOverallStatus(
          updatedUser.addresses.map((a) => a.status),
        );

        await this.kycRepository.findByIdAndUpdate(realKycId, {
          status: overallStatus,
        });
      } else {
        await this.kycRepository.findByIdAndUpdate(realKycId, {
          status: KYCStatus.ASSIGNED,
          assignedAgent: agentId,
          mobileJobId: mobileJobId,
        });
      }

      return { message: 'Agent assigned successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async handleStartReview(webJobId: string, mobileJobId: string) {
    try {
      const realKycId = webJobId.includes('_')
        ? webJobId.split('_')[0]
        : webJobId;

      const kycUser = await this.kycRepository.findById(realKycId);

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      const addressIndex = kycUser.addresses?.findIndex(
        (addr) => addr.mobileJobId === mobileJobId,
      );

      if (addressIndex !== undefined && addressIndex >= 0) {
        await this.kycRepository.findByIdAndUpdate(realKycId, {
          [`addresses.${addressIndex}.status`]: KYCStatus.IN_REVIEW,
        });

        const updatedUser = await this.kycRepository.findById(realKycId);
        const overallStatus = this.calculateOverallStatus(
          updatedUser.addresses.map((a) => a.status),
        );

        await this.kycRepository.findByIdAndUpdate(realKycId, {
          status: overallStatus,
        });
      } else {
        await this.kycRepository.findByIdAndUpdate(realKycId, {
          status: KYCStatus.IN_REVIEW,
        });
      }

      return { message: 'Review started successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async handleVerificationSubmission(data: SubmitVerificationDto) {
    try {
      const realKycId = data.web_job_id.includes('_')
        ? data.web_job_id.split('_')[0]
        : data.web_job_id;

      const kycUser = await this.kycRepository.findById(realKycId);

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      let verifiedAddress: string | undefined;
      try {
        const address = await this.geocodingService.reverseGeocode(
          data.verified_lat,
          data.verified_lng,
        );
        if (address) {
          verifiedAddress = address;
        }
      } catch (error) {
        this.logger.error('Failed to reverse geocode:', error.message);
      }

      let addressIndex: number | undefined;

      if (data.mobile_job_id) {
        const mobileJobIdStr = String(data.mobile_job_id);
        addressIndex = kycUser.addresses?.findIndex(
          (addr) => addr.mobileJobId === mobileJobIdStr,
        );
      }

      if (
        (addressIndex === undefined || addressIndex === -1) &&
        data.web_job_id.includes('_')
      ) {
        const indexFromWebJobId = parseInt(data.web_job_id.split('_')[1]);
        if (!isNaN(indexFromWebJobId)) {
          this.logger.warn(
            `mobile_job_id ${data.mobile_job_id} not found - using index from web_job_id: ${indexFromWebJobId}`,
          );
          addressIndex = indexFromWebJobId;
        }
      }

      if (
        addressIndex !== undefined &&
        addressIndex >= 0 &&
        kycUser.addresses
      ) {
        await this.kycRepository.findByIdAndUpdate(realKycId, {
          [`addresses.${addressIndex}.status`]:
            KYCStatus.VERIFICATION_SUBMITTED,
          [`addresses.${addressIndex}.verificationData`]: {
            verifiedLatitude: data.verified_lat,
            verifiedLongitude: data.verified_lng,
            verifiedAddress,
            verificationPhotos: data.photos,
            agentNotes: data.agent_notes,
            verifiedAt: new Date(),
          },
        });

        const updatedUser = await this.kycRepository.findById(realKycId);
        const overallStatus = this.calculateOverallStatus(
          updatedUser.addresses.map((a) => a.status),
        );

        await this.kycRepository.findByIdAndUpdate(realKycId, {
          status: overallStatus,
        });
      } else {
        this.logger.error(
          `Could not determine address index for web_job_id: ${data.web_job_id}, mobile_job_id: ${data.mobile_job_id}`,
        );
        throw new NotFoundException('Address not found for this verification');
      }

      return { message: 'Verification submitted successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async makeVerificationDecision(
    id: string,
    approved: boolean,
    rejectionReason: string | undefined,
    user: any,
    addressIndex?: number,
  ) {
    try {
      const { organizationId } = user;

      const kycUser = await this.kycRepository.findOne({
        _id: id,
        organization: organizationId,
      });

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      const hasMultipleAddresses =
        kycUser.addresses && kycUser.addresses.length > 0;

      if (hasMultipleAddresses && addressIndex !== undefined) {
        const address = kycUser.addresses[addressIndex];

        if (!address) {
          throw new NotFoundException('Address not found');
        }

        if (address.status !== KYCStatus.VERIFICATION_SUBMITTED) {
          throw new BadRequestException(
            'Address is not in verification submitted state',
          );
        }

        const newStatus = approved ? KYCStatus.VERIFIED : KYCStatus.REJECTED;

        const updates: any = {
          [`addresses.${addressIndex}.status`]: newStatus,
        };

        if (!approved) {
          updates[`addresses.${addressIndex}.rejectionReason`] =
            rejectionReason || 'Verification rejected by admin';
        }

        await this.kycRepository.findByIdAndUpdate(id, updates);

        const updatedUser = await this.kycRepository.findById(id);
        const overallStatus = this.calculateOverallStatus(
          updatedUser.addresses.map((a) => a.status),
        );

        const overallUpdates: any = {
          status: overallStatus,
          updatedBy: user.sub,
        };

        if (overallStatus === KYCStatus.VERIFIED) {
          overallUpdates.verificationDate = new Date();
          overallUpdates.verifiedAt = new Date();
        }

        await this.kycRepository.findByIdAndUpdate(id, overallUpdates);

        try {
          const mobileStatus = approved ? 'completed' : 'rejected';
          await this.mobileIntegrationService.updateMobileJobStatus(
            id,
            mobileStatus,
          );
        } catch (error) {
          this.logger.error(
            'Failed to update mobile job status:',
            error.message,
          );
        }

        return {
          message: approved
            ? `${address.label} verification approved`
            : `${address.label} verification rejected`,
        };
      }

      if (hasMultipleAddresses) {
        const allSubmitted = kycUser.addresses.every(
          (addr) => addr.status === KYCStatus.VERIFICATION_SUBMITTED,
        );

        if (!allSubmitted) {
          throw new BadRequestException(
            'Not all addresses have been verified yet',
          );
        }

        const updates: any = {};
        kycUser.addresses.forEach((addr, index) => {
          updates[`addresses.${index}.status`] = approved
            ? KYCStatus.VERIFIED
            : KYCStatus.REJECTED;
        });

        if (approved) {
          updates.verificationDate = new Date();
          updates.verifiedAt = new Date();
          updates.status = KYCStatus.VERIFIED;
        } else {
          updates.rejectionReason =
            rejectionReason || 'Verification rejected by admin';
          updates.status = KYCStatus.REJECTED;
        }

        updates.updatedBy = user.sub;

        await this.kycRepository.findByIdAndUpdate(id, updates);
      } else {
        if (kycUser.status !== KYCStatus.VERIFICATION_SUBMITTED) {
          throw new BadRequestException(
            'KYC user is not in verification submitted state',
          );
        }

        const updateData: any = {
          status: approved ? KYCStatus.VERIFIED : KYCStatus.REJECTED,
          updatedBy: user.sub,
        };

        if (approved) {
          updateData.verificationDate = new Date();
          updateData.verifiedAt = new Date();
        } else {
          updateData.rejectionReason =
            rejectionReason || 'Verification rejected by admin';
        }

        await this.kycRepository.findByIdAndUpdate(id, updateData);
      }

      try {
        const mobileStatus = approved ? 'completed' : 'rejected';
        await this.mobileIntegrationService.updateMobileJobStatus(
          id,
          mobileStatus,
        );
      } catch (error) {
        this.logger.error('Failed to update mobile job status:', error.message);
      }

      return {
        message: approved ? 'Verification approved' : 'Verification rejected',
      };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async deleteKYCUser(id: string, user: any) {
    try {
      const { organizationId, sub: userId } = user;

      const existingUser = await this.kycRepository.findOne({
        _id: id,
        organization: organizationId,
      });

      if (!existingUser) {
        throw new NotFoundException('KYC user not found');
      }

      if (existingUser.status !== KYCStatus.PENDING) {
        throw new BadRequestException(
          'Only pending verification requests can be deleted.',
        );
      }

      await this.kycRepository.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      this.logger.log(`KYC user ${id} soft deleted by user ${userId}`);

      return { message: 'KYC user deleted successfully' };
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async addDocument(userId: string, documentData: any, user: any) {
    try {
      const { organizationId } = user;

      const kycUser = await this.kycRepository.findOne({
        _id: userId,
        organization: organizationId,
      });

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      if (kycUser.status !== KYCStatus.PENDING) {
        throw new BadRequestException(
          'Documents can only be uploaded for pending verification requests.',
        );
      }

      const newDocument = {
        _id: new Types.ObjectId(),
        ...documentData,
        uploadedAt: new Date(),
        verified: false,
      };

      kycUser.documents.push(newDocument);
      await kycUser.save();

      return kycUser;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async removeDocument(userId: string, documentId: string, user: any) {
    try {
      const { organizationId } = user;

      const kycUser = await this.kycRepository.findOne({
        _id: userId,
        organization: organizationId,
      });

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      if (kycUser.status !== KYCStatus.PENDING) {
        throw new BadRequestException(
          'Documents can only be deleted for pending verification requests.',
        );
      }

      kycUser.documents = kycUser.documents.filter(
        (doc: any) => doc._id.toString() !== documentId,
      );

      await kycUser.save();

      return kycUser;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  async generateKYCReport(id: string, user: any): Promise<Buffer> {
    try {
      const { organizationId } = user;

      const kycUser = await this.kycRepository.findOne({
        _id: id,
        organization: organizationId,
      });

      if (!kycUser) {
        throw new NotFoundException('KYC user not found');
      }

      const pdfBuffer = await this.pdfGenerationService.generateKYCReport(
        kycUser,
      );

      return pdfBuffer;
    } catch (error) {
      handleErrorCatch(error);
    }
  }

  private async createMultiAddressKYCUser(
    data: CreateKYCUserDto,
    userId: string,
    organizationId: string,
  ) {
    const geocodedAddresses = [];

    for (const address of data.addresses) {
      let latitude: number | undefined;
      let longitude: number | undefined;

      const geocodingResult = await this.geocodingService.geocodeAddress({
        streetNumber: address.streetNumber,
        streetName: address.streetName,
        landmark: address.landmark,
        city: address.city,
        lga: address.lga,
        state: address.state,
        country: address.country,
      });

      if (geocodingResult) {
        latitude = geocodingResult.latitude;
        longitude = geocodingResult.longitude;
      }

      geocodedAddresses.push({
        label: address.label,
        streetNumber: address.streetNumber,
        streetName: address.streetName,
        landmark: address.landmark,
        city: address.city,
        lga: address.lga,
        state: address.state,
        country: address.country || 'Nigeria',
        latitude,
        longitude,
        status: KYCStatus.PENDING,
      });
    }

    const firstAddress = geocodedAddresses[0];
    const overallStatus = this.calculateOverallStatus(
      geocodedAddresses.map((a) => a.status),
    );

    const kycUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      bvn: data.bvn,
      nin: data.nin,
      passportNumber: data.passportNumber,
      addresses: geocodedAddresses,
      streetNumber: firstAddress.streetNumber,
      streetName: firstAddress.streetName,
      landmark: firstAddress.landmark,
      city: firstAddress.city,
      lga: firstAddress.lga,
      state: firstAddress.state,
      country: firstAddress.country,
      latitude: firstAddress.latitude,
      longitude: firstAddress.longitude,
      organization: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
      status: overallStatus,
      documents: [],
      submittedAt: new Date(),
    };

    const kycUser = await this.kycRepository.create(kycUserData);

    this.createMobileJobsInBackground(
      kycUser._id.toString(),
      geocodedAddresses,
      data.firstName,
      data.lastName,
      data.phone,
    );

    return kycUser;
  }

  private createMobileJobsInBackground(
    kycUserId: string,
    geocodedAddresses: any[],
    firstName: string,
    lastName: string,
    phone: string,
  ) {
    geocodedAddresses.forEach(async (address, i) => {
      if (address.latitude && address.longitude) {
        const compositeWebJobId = `${kycUserId}_${i}`;

        this.logger.log(`Creating mobile job ${i + 1} for KYC ${kycUserId}`);

        try {
          const tempKycUser = {
            _id: compositeWebJobId,
            firstName: firstName,
            lastName: lastName,
            email: '',
            phone: phone,
            streetNumber: address.streetNumber,
            streetName: address.streetName,
            landmark: address.landmark,
            city: address.city,
            lga: address.lga,
            state: address.state,
            country: address.country,
            latitude: address.latitude,
            longitude: address.longitude,
          } as any;

          const mobileJobResponse =
            await this.mobileIntegrationService.createMobileJob(tempKycUser);

          if (mobileJobResponse?.data?.mobile_job_id) {
            this.logger.log(
              `Mobile job ${i + 1} created: ${
                mobileJobResponse.data.mobile_job_id
              }`,
            );

            await this.kycRepository.findByIdAndUpdate(kycUserId, {
              [`addresses.${i}.mobileJobId`]:
                mobileJobResponse.data.mobile_job_id,
            });

            if (i === 0) {
              await this.kycRepository.findByIdAndUpdate(kycUserId, {
                mobileJobId: mobileJobResponse.data.mobile_job_id,
              });
            }
          }
        } catch (error) {
          this.logger.warn(
            `⚠️  Mobile job creation failed for address ${i + 1}`,
          );
          this.logger.warn(`Error: ${error.message}`);
        }
      }
    });
  }

  private async createSingleAddressKYCUser(
    data: CreateKYCUserDto,
    userId: string,
    organizationId: string,
  ) {
    let latitude: number | undefined;
    let longitude: number | undefined;

    const geocodingResult = await this.geocodingService.geocodeAddress({
      streetNumber: data.streetNumber,
      streetName: data.streetName,
      landmark: data.landmark,
      city: data.city,
      lga: data.lga,
      state: data.state,
      country: data.country,
    });

    if (geocodingResult) {
      latitude = geocodingResult.latitude;
      longitude = geocodingResult.longitude;
    }

    const kycUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      bvn: data.bvn,
      nin: data.nin,
      passportNumber: data.passportNumber,
      streetNumber: data.streetNumber,
      streetName: data.streetName,
      landmark: data.landmark,
      city: data.city,
      lga: data.lga,
      state: data.state,
      country: data.country || 'Nigeria',
      latitude,
      longitude,
      organization: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
      status: KYCStatus.PENDING,
      documents: [],
      submittedAt: new Date(),
    };

    const kycUser = await this.kycRepository.create(kycUserData);

    if (kycUser.latitude && kycUser.longitude) {
      try {
        const mobileJobResponse =
          await this.mobileIntegrationService.createMobileJob(kycUser);

        if (mobileJobResponse?.data?.mobile_job_id) {
          await this.kycRepository.findByIdAndUpdate(kycUser._id, {
            mobileJobId: mobileJobResponse.data.mobile_job_id,
          });
        }
      } catch (error) {
        this.logger.error('Failed to create mobile job:', error.message);
      }
    }

    return kycUser;
  }

  private calculateOverallStatus(addressStatuses: KYCStatus[]): KYCStatus {
    if (addressStatuses.every((s) => s === KYCStatus.VERIFIED)) {
      return KYCStatus.VERIFIED;
    }
    if (addressStatuses.some((s) => s === KYCStatus.REJECTED)) {
      return KYCStatus.REJECTED;
    }
    if (addressStatuses.some((s) => s === KYCStatus.VERIFICATION_SUBMITTED)) {
      return KYCStatus.VERIFICATION_SUBMITTED;
    }
    if (addressStatuses.some((s) => s === KYCStatus.IN_REVIEW)) {
      return KYCStatus.IN_REVIEW;
    }
    if (addressStatuses.some((s) => s === KYCStatus.ASSIGNED)) {
      return KYCStatus.ASSIGNED;
    }
    return KYCStatus.PENDING;
  }
}
