import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
} from 'class-validator';

export enum LeaveType {
  Annual = 'annual',
  Sick = 'sick',
  Other = 'other',
}

export enum CompensationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Paid = 'paid',
}

export class CreateEmployeeCompensationDto {
  @IsMongoId()
  employeeId: string;

  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsNumber()
  @Min(0)
  days: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  baseSalaryAtCalculation: number;

  @IsNumber()
  @Min(1)
  divisor: number;

  @IsOptional()
  @IsEnum(CompensationStatus)
  status?: CompensationStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

