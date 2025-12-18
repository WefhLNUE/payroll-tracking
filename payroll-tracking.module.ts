// Models
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from 'src/employee-profile/Models/employee-profile.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from 'src/employee-profile/Models/employee-system-role.schema';
import {
  payGrade,
  payGradeSchema,
} from '../payroll-configuration/Models/payGrades.schema';
import {
  LeaveEntitlement,
  LeaveEntitlementSchema,
} from '../leaves/Models/leave-entitlement.schema';
import { LeaveType, LeaveTypeSchema } from '../leaves/Models/leave-type.schema';
import {
  allowance,
  allowanceSchema,
} from '../payroll-configuration/Models/allowance.schema';
import {
  AttendanceRecord,
  AttendanceRecordSchema,
} from '../time-management/Models/attendance-record.schema';
import {
  AttendanceCorrectionRequest,
  AttendanceCorrectionRequestSchema,
} from '../time-management/Models/attendance-correction-request.schema';
import {
  LatenessRule,
  latenessRuleSchema,
} from '../time-management/Models/lateness-rule.schema';
import {
  insuranceBrackets,
  insuranceBracketsSchema,
} from '../payroll-configuration/Models/insuranceBrackets.schema';

// Modules
import { forwardRef, Module } from '@nestjs/common';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { refunds, refundsSchema } from './Models/refunds.schema';
import {
  paySlip,
  paySlipSchema,
} from 'src/payroll-execution/Models/payslip.schema';
import {
  payrollRuns,
  payrollRunsSchema,
} from 'src/payroll-execution/Models/payrollRuns.schema';
import { claims, claimsSchema } from './Models/claims.schema';
import { disputes, disputesSchema } from './Models/disputes.schema';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';
import { TimeManagementModule } from 'src/time-management/time-management.module';
import {
  NotificationLog,
  NotificationLogSchema,
} from 'src/time-management/Models/notification-log.schema';
import {
  taxRules,
  taxRulesSchema,
} from 'src/payroll-configuration/Models/taxRules.schema';
@Module({
  imports: [
    PayrollConfigurationModule,
    forwardRef(() => PayrollExecutionModule),
    TimeManagementModule,

    MongooseModule.forFeature([
      { name: paySlip.name, schema: paySlipSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: payGrade.name, schema: payGradeSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: taxRules.name, schema: taxRulesSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: allowance.name, schema: allowanceSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      {
        name: AttendanceCorrectionRequest.name,
        schema: AttendanceCorrectionRequestSchema,
      },
      { name: LatenessRule.name, schema: latenessRuleSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: refunds.name, schema: refundsSchema },
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: payrollRuns.name, schema: payrollRunsSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [PayrollTrackingController],
  providers: [PayrollTrackingService],
  exports: [PayrollTrackingService],
})
export class PayrollTrackingModule {}
