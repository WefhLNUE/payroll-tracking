import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EmployeeSalary extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  salary: number;

  @Prop({ type: Types.ObjectId, ref: 'ContractType', required: true })
  ContractType: Types.ObjectId;
}

export const PayslipSchema = SchemaFactory.createForClass(EmployeeSalary);
