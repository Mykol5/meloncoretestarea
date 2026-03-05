import { Document, Schema, model, Types } from 'mongoose';
import {
  ProjectStatus,
  ProjectSector,
  ProjectRegion,
  FundingSource,
  ProjectPriority,
} from 'src/libs/constants';

export interface TeamMember {
  name: string;
  role: string;
  responsibilities?: string;
  email?: string;
  phone?: string;
}

export interface FileAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  description?: string;
  uploadedAt: Date;
}

export interface ProjectTag {
  name: string;
  color?: string;
}

export interface Project extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  sector: ProjectSector;
  region: ProjectRegion;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  spentBudget: number;
  targetHouseholds?: number;
  actualHouseholds?: number;
  coverageArea?: number; // in km²
  fundingSource?: FundingSource;
  teamMembers: TeamMember[];
  tags: ProjectTag[];
  attachments: FileAttachment[];
  progressPercentage: number;
  impactScore: number;
  location?: string;
  objectives: string[];
  expectedOutcomes: string[];
  risks: string[];
  notes?: string;
  isActive: boolean;
  organization: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
    },
    responsibilities: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const FileAttachmentSchema = new Schema(
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
    description: {
      type: String,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ProjectTagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const ProjectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
      maxlength: 200,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      trim: true,
    },
    sector: {
      type: String,
      enum: Object.values(ProjectSector),
      required: true,
      index: true,
    },
    region: {
      type: String,
      enum: Object.values(ProjectRegion),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.DRAFT,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ProjectPriority),
      default: ProjectPriority.MEDIUM,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    spentBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetHouseholds: {
      type: Number,
      min: 0,
    },
    actualHouseholds: {
      type: Number,
      default: 0,
      min: 0,
    },
    coverageArea: {
      type: Number,
      min: 0,
    },
    fundingSource: {
      type: String,
      enum: Object.values(FundingSource),
      index: true,
    },
    teamMembers: {
      type: [TeamMemberSchema],
      default: [],
    },
    tags: {
      type: [ProjectTagSchema],
      default: [],
    },
    attachments: {
      type: [FileAttachmentSchema],
      default: [],
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    impactScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    objectives: {
      type: [String],
      default: [],
    },
    expectedOutcomes: {
      type: [String],
      default: [],
    },
    risks: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient querying
ProjectSchema.index({ organization: 1, status: 1 });
ProjectSchema.index({ organization: 1, sector: 1 });
ProjectSchema.index({ organization: 1, region: 1 });
ProjectSchema.index({ organization: 1, startDate: 1 });
ProjectSchema.index({ organization: 1, endDate: 1 });
ProjectSchema.index({ organization: 1, progressPercentage: 1 });
ProjectSchema.index({ organization: 1, impactScore: 1 });

// Text search index
ProjectSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  objectives: 'text',
  expectedOutcomes: 'text',
});

// Virtual for budget utilization percentage
ProjectSchema.virtual('budgetUtilizationPercentage').get(function () {
  if (this.totalBudget === 0) return 0;
  return Math.round((this.spentBudget / this.totalBudget) * 100);
});

// Virtual for household reach percentage
ProjectSchema.virtual('householdReachPercentage').get(function () {
  if (!this.targetHouseholds || this.targetHouseholds === 0) return 0;
  return Math.round((this.actualHouseholds / this.targetHouseholds) * 100);
});

// Virtual for project duration in days
ProjectSchema.virtual('durationInDays').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days remaining
ProjectSchema.virtual('daysRemaining').get(function () {
  if (!this.endDate) return null;
  const today = new Date();
  const diffTime = this.endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ProjectSchema.pre('save', function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  }

  if (this.spentBudget > this.totalBudget) {
    next(new Error('Spent budget cannot exceed total budget'));
  }

  if (
    this.actualHouseholds &&
    this.targetHouseholds &&
    this.actualHouseholds > this.targetHouseholds * 1.5
  ) {
    console.warn(
      `Project ${this.title}: Actual households (${this.actualHouseholds}) significantly exceeds target (${this.targetHouseholds})`,
    );
  }

  next();
});

export const ProjectModel = model<Project>('Project', ProjectSchema);

class ProjectsModel {
  public static schema: Schema = ProjectSchema;
  public static model = ProjectModel;
}

export default ProjectsModel;
