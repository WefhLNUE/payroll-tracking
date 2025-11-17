import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsMongoId,
} from 'class-validator';

export enum DisputeCategory {
  Salary = 'salary',
  Overtime = 'overtime',
  Deduction = 'deduction',
  Allowance = 'allowance',
  Attendance = 'attendance',
  Bonus = 'bonus',
  Commission = 'commission',
  FinalSettlement = 'final_settlement',
  Other = 'other',
}

export enum DisputeStatus {
  Pending = 'pending',
  UnderReview = 'under_review',
  Resolved = 'resolved',
  Rejected = 'rejected',
}

export class CreateDisputeDto {
  @IsMongoId()
  employeeId: string;

  @IsEnum(DisputeCategory)
  category: DisputeCategory;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsString()
  managerComment?: string;

  @IsOptional()
  @IsString()
  payrollComment?: string;

  @IsOptional()
  @IsString()
  resolutionDetails?: string;

  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}

