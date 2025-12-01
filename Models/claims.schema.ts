import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
<<<<<<< HEAD:models/claims.schema.ts
import { EmployeeProfile as Employee } from '../../employee-profile/Models/employee-profile.schema';
=======
import {  EmployeeProfile as Employee} from '../../employee-profile/Models/employee-profile.schema';
>>>>>>> ac7885bbfa6174a11eafbb5af395e64a4a29ee37:Models/claims.schema.ts
import { ClaimStatus } from '../enums/payroll-tracking-enum';

export type claimsDocument = HydratedDocument<claims>;

@Schema({ timestamps: true })
export class claims {
  @Prop({ required: true, unique: true })
  claimId: string; // for frontend view purposes ex: CLAIM-0001

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  claimType: string; // for example: medical, etc

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
    required: true,
  })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Employee.name })
  financeStaffId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Employee.name })
  payrollSpecialistId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Employee.name })
  payrollManagerId?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({})
  approvedAmount?: number;

  @Prop({
    required: true,
    type: String,
    enum: ClaimStatus,
    default: ClaimStatus.UNDER_REVIEW,
  })
  status: ClaimStatus; // under review,pending_manager_approval, approved, rejected

  @Prop()
  rejectionReason?: string;

  @Prop()
  resolutionComment?: string;
}

export const claimsSchema = SchemaFactory.createForClass(claims);
