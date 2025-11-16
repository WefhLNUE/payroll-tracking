import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Dispute extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'salary',
      'overtime',
      'deduction',
      'allowance',
      'attendance',
      'bonus',
      'commission',
      'final_settlement',
      'other',
    ],
  })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    default: 'pending',
    enum: ['pending', 'under_review', 'resolved', 'rejected'],
  })
  status: string;

  @Prop()
  managerComment: string;

  @Prop()
  payrollComment: string;

  @Prop()
  resolutionDetails: string;

  @Prop()
  resolvedAt: Date;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);
