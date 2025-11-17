import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PayslipStatus, PayslipType } from '../models/PaySlip.schema';
import {
  ComponentDirection,
  ComponentCategory,
} from '../models/PayslipComponent.schema';

export class CreatePayslipComponentDto {
  @IsEnum(ComponentDirection)
  direction: ComponentDirection;

  @IsEnum(ComponentCategory)
  category: ComponentCategory;

  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  lawReference?: string;
}

export class CreatePayslipDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  payrollRunId: string;

  @IsOptional()
  @IsEnum(PayslipType)
  type?: PayslipType;

  @IsOptional()
  @IsEnum(PayslipStatus)
  status?: PayslipStatus;

  @IsString()
  periodLabel: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsDateString()
  processedAt: string;

  @IsDateString()
  effectiveDate: string;

  @IsString()
  currency: string;

  @IsNumber()
  baseSalary: number;

  @IsNumber()
  allowancesTotal: number;

  @IsNumber()
  grossSalary: number;

  @IsNumber()
  taxesTotal: number;

  @IsNumber()
  insuranceTotal: number;

  @IsNumber()
  otherDeductionsTotal: number;

  @IsNumber()
  employerContributionsTotal: number;

  @IsNumber()
  netSalary: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePayslipComponentDto)
  components?: CreatePayslipComponentDto[];

  @IsOptional()
  @IsString()
  pdfUrl?: string;
}

