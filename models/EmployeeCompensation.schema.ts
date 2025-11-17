import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class EmployeeCompensation extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  employeeId: Types.ObjectId;

  // which leave this applies to (e.g., 'annual', 'sick' if encashable)
  @Prop({ type: String, required: true, enum: ["annual", "sick", "other"] })
  leaveType: string;

  // number of leave days the employee wants encashed (or computed unused days)
  @Prop({ type: Number, required: true, min: 0 })
  days: number;

  // monetary amount paid for this encashment (calculated)
  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  // salary snapshot used for calculation
  @Prop({ type: Number, required: true, min: 0 })
  baseSalaryAtCalculation: number;

  // number of working days used as divisor (e.g., 260 annual/12 monthly etc.)
  @Prop({ type: Number, required: true, min: 1 })
  divisor: number;

  // status of encashment request
  @Prop({
    type: String,
    enum: ["pending", "approved", "rejected", "paid"],
    default: "pending",
  })
  status: string;

  @Prop()
  note?: string;
}

export const LeaveEncashmentSchema =
  SchemaFactory.createForClass(EmployeeCompensation);
