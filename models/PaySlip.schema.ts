import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PayslipComponent,
  PayslipComponentSchema,
} from './PayslipComponent.schema';

export type PayslipDocument = Payslip & Document;

export enum PayslipStatus {
  Draft = 'DRAFT',
  UnderReview = 'UNDER_REVIEW',
  Paid = 'PAID',
  Disputed = 'DISPUTED',
  Refunded = 'REFUNDED',
}

export enum PayslipType {
  Regular = 'REGULAR',
  SigningBonus = 'SIGNING_BONUS',
  ResignationSettlement = 'RESIGNATION_SETTLEMENT',
  TerminationSettlement = 'TERMINATION_SETTLEMENT',
  Refund = 'REFUND',
}

@Schema({ timestamps: true })
export class Payslip {
  @Prop({ type: Types.ObjectId, ref: 'Employee', index: true, required: true })
  employeeId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'PayrollRun',
    index: true,
    required: true,
  })
  payrollRunId: Types.ObjectId;

  @Prop({ enum: PayslipType, default: PayslipType.Regular })
  type: PayslipType;

  @Prop({ enum: PayslipStatus, default: PayslipStatus.Paid, index: true })
  status: PayslipStatus;

  @Prop({ required: true })
  periodLabel: string;

  @Prop({ type: Date, required: true })
  periodStart: Date;

  @Prop({ type: Date, required: true })
  periodEnd: Date;

  @Prop({ type: Date, required: true })
  processedAt: Date;

  @Prop({ type: Date, required: true })
  effectiveDate: Date;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: Number, required: true })
  baseSalary: number;

  @Prop({ type: Number, required: true })
  allowancesTotal: number;

  @Prop({ type: Number, required: true })
  grossSalary: number;

  @Prop({ type: Number, required: true })
  taxesTotal: number;

  @Prop({ type: Number, required: true })
  insuranceTotal: number;

  @Prop({ type: Number, required: true })
  otherDeductionsTotal: number;

  @Prop({ type: Number, required: true })
  employerContributionsTotal: number;

  @Prop({ type: Number, required: true })
  netSalary: number;

  @Prop({ type: [PayslipComponentSchema], default: [] })
  components: PayslipComponent[];

  @Prop()
  pdfUrl?: string;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);
