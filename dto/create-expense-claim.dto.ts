import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export enum ExpenseClaimType {
  Travel = 'travel',
  Meal = 'meal',
  Accommodation = 'accommodation',
  Other = 'other',
}

export enum ExpenseClaimStatus {
  SpecialistApproved = 'Specialist_Approved',
  SpecialistRejected = 'Secialist_Rejected',
  ManagerApproved = 'Manager_Approved',
  ManagerRejected = 'Manager_Rejected',
  RefundScheduled = 'Refund_Scheduled',
  PaidInPayroll = 'Paid_In_Payroll',
}

export class CreateExpenseClaimDto {
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  amount: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  receipts?: string[];

  @IsOptional()
  @IsEnum(ExpenseClaimStatus)
  status?: ExpenseClaimStatus;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}

