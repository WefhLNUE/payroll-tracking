import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayslipComponentDocument = PayslipComponent & Document;

export enum ComponentDirection {
  Earning = 'Earning',
  Deduction = 'Deduction',
  Contribution = 'Contribution',
}

export enum ComponentCategory {
  BaseSalary = 'Base_Salary',
  Allowance = 'Allowance',
  Tax = 'Tax',
  Insurance = 'Insurance',
  MisconductPenalty = 'Misconduct_Penalty',
  UnpaidLeave = 'Unpaid_Leave',
  OtherDeduction = 'Other_Deduction',
  EmployerContribution = 'Employer_Contribution',
  Bonus = 'Bonus',
  Refund = 'Refund',
}

@Schema({ timestamps: true })
export class PayslipComponent {
  @Prop({ required: true, enum: ComponentDirection })
  direction: ComponentDirection;

  @Prop({ required: true, enum: ComponentCategory })
  category: ComponentCategory;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop()
  lawReference?: string;
}

export const PayslipComponentSchema =
  SchemaFactory.createForClass(PayslipComponent);
