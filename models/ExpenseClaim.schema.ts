 import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ExpenseClaim extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  type: string; // e.g., 'travel', 'meal', 'accommodation'

  @Prop()
  description: string;

  @Prop([{ type: String }])
  receipts: string[]; // could be URLs to uploaded documents/images

  @Prop({
    default: 'submitted',
    enum: [
      'Specialist_Approved',
      'Secialist_Rejected',
      'Manager_Approved',
      'Manager_Rejected',
      'Refund_Scheduled',
      'Paid_In_Payroll',
    ],
  })
  status: string;

  @Prop()
  approvedAt: Date;
}

export const ExpenseClaimSchema = SchemaFactory.createForClass(ExpenseClaim);
