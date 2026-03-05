import { Document, Schema, model, Types } from 'mongoose';
import { KYCStatus, DocumentType } from 'src/libs/constants';

export interface KYCDocument {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  documentType: DocumentType;
  uploadedAt: Date;
  verified: boolean;
  ocrData?: {
    extractedText: string;
    confidence: number;
    detectedFields: Record<string, string>;
    mismatches?: string[];
  };
}

export interface VerificationData {
  verifiedLatitude?: number;
  verifiedLongitude?: number;
  verifiedAddress?: string;
  verificationPhotos?: string[];
  agentNotes?: string;
  verifiedAt?: Date;
}

export interface AddressData {
  label: string;
  streetNumber?: string;
  streetName?: string;
  landmark?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status?: KYCStatus;
  verificationData?: VerificationData;
  mobileJobId?: string;
}

export interface KYCUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn?: string;
  nin?: string;
  passportNumber?: string;
  addresses: AddressData[];
  streetNumber?: string;
  streetName?: string;
  landmark?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status: KYCStatus;
  documents: KYCDocument[];
  rejectionReason?: string;
  verificationDate?: Date;
  submittedAt: Date;
  assignedAgent?: Types.ObjectId;
  agentNotes?: string;
  verifiedAt?: Date;
  verificationData?: VerificationData;
  mobileJobId?: string;
  organization: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KYCDocumentSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    ocrData: {
      extractedText: String,
      confidence: Number,
      detectedFields: {
        type: Map,
        of: String,
      },
      mismatches: [String],
    },
  },
  { _id: true },
);

const VerificationDataSchema = new Schema(
  {
    verifiedLatitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    verifiedLongitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    verifiedAddress: String,
    verificationPhotos: [String],
    agentNotes: {
      type: String,
      trim: true,
    },
    verifiedAt: Date,
  },
  { _id: false },
);

const AddressDataSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      default: 'Home Address',
    },
    streetNumber: {
      type: String,
      trim: true,
    },
    streetName: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    lga: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
    },
    verificationData: {
      type: VerificationDataSchema,
    },
    mobileJobId: {
      type: String,
    },
  },
  { _id: false },
);

const KYCUserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bvn: {
      type: String,
      trim: true,
      maxlength: 11,
    },
    nin: {
      type: String,
      trim: true,
      maxlength: 11,
    },
    passportNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    addresses: {
      type: [AddressDataSchema],
      default: [],
    },
    streetNumber: {
      type: String,
      trim: true,
    },
    streetName: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    lga: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
      index: true,
    },
    documents: {
      type: [KYCDocumentSchema],
      default: [],
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    verificationDate: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    agentNotes: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
    verificationData: {
      type: VerificationDataSchema,
    },
    mobileJobId: {
      type: String,
      sparse: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

KYCUserSchema.index({ organization: 1, status: 1 });
KYCUserSchema.index({ organization: 1, email: 1 }, { unique: true });
KYCUserSchema.index({ organization: 1, submittedAt: 1 });
KYCUserSchema.index({ organization: 1, isDeleted: 1 });
KYCUserSchema.index({ mobileJobId: 1 });
KYCUserSchema.index({ latitude: 1, longitude: 1 });

KYCUserSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
});

KYCUserSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === KYCStatus.VERIFIED &&
    !this.verificationDate
  ) {
    this.verificationDate = new Date();
  }

  if (this.isModified('status') && this.status !== KYCStatus.REJECTED) {
    this.rejectionReason = undefined;
  }

  next();
});

KYCUserSchema.pre(/^find/, function (next) {
  const query = this as any;
  if (!query.getOptions().includeDeleted) {
    query.where({ isDeleted: { $ne: true } });
  }
  next();
});

export const KYCUserModel = model<KYCUser>('KYCUser', KYCUserSchema);

class KYCUsersModel {
  public static schema: Schema = KYCUserSchema;
  public static model = KYCUserModel;
}

export default KYCUsersModel;
