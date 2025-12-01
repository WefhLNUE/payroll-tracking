import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';

// Models
import { paySlip, paySlipSchema } from '../payroll-execution/Models/payslip.schema';
import { EmployeeProfile, EmployeeProfileSchema } from 'src/employee-profile/Models/employee-profile.schema';
import { payGrade, payGradeSchema } from '../payroll-configuration/Models/payGrades.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from '../leaves/Models/leave-entitlement.schema';
import { LeaveType, LeaveTypeSchema } from '../leaves/Models/leave-type.schema';
import { allowance, allowanceSchema } from '../payroll-configuration/Models/allowance.schema';
import { AttendanceRecord, AttendanceRecordSchema } from '../time-management/Models/attendance-record.schema';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestSchema } from '../time-management/Models/attendance-correction-request.schema';
import { LatenessRule, latenessRuleSchema } from '../time-management/Models/lateness-rule.schema';
import { insuranceBrackets, insuranceBracketsSchema } from '../payroll-configuration/Models/insuranceBrackets.schema';
import { refunds, refundsSchema } from './Models/refunds.schema';
import { claims, claimsSchema } from './Models/claims.schema';
import { disputes, disputesSchema } from './Models/disputes.schema';
import {ClaimStatus} from'./enums/payroll-tracking-enum'
import { taxRules,taxRulesDocument } from 'src/payroll-configuration/Models/taxRules.schema';
// Modules
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';

@Module({

  imports: [

    MongooseModule.forFeature([
      { name: paySlip.name, schema: paySlipSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: payGrade.name, schema: payGradeSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: allowance.name, schema: allowanceSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
      { name: LatenessRule.name, schema: latenessRuleSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: refunds.name, schema: refundsSchema },
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: disputes.name, schema: disputesSchema },
      
    ]),
    PayrollConfigurationModule,
    forwardRef(() => PayrollExecutionModule),
  ],
  controllers: [PayrollTrackingController],
  providers: [PayrollTrackingService],
  exports: [PayrollTrackingService],
})
export class PayrollTrackingModule {}
