import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Payslip extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({
    enum: [
      'signingbonus',
      'termination',
      'resignation',
      'salary',
      'allowances',
      'compensation',
    ],
  })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  processeddate: Date;

  @Prop({ required: true })
  effectivedate: Date;

  @Prop({
    default: 'under_review',
    enum: ['under_review', 'approved', 'rejected', 'system_processed'],
  })
  status: string;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);
