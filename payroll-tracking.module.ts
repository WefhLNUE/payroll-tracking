import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { Payslip, PayslipSchema } from './models/PaySlip.schema';
import {
  PayslipComponent,
  PayslipComponentSchema,
} from './models/PayslipComponent.schema';
import { Dispute, DisputeSchema } from './models/Dispute.schema';
import {
  EmployeeCompensation,
  LeaveEncashmentSchema,
} from './models/EmployeeCompensation.schema';
import {
  EmployeeSalary,
  PayslipSchema as EmployeeSalarySchema,
} from './models/EmployeeSalary.schmea';
import { ExpenseClaim, ExpenseClaimSchema } from './models/ExpenseClaim.schema';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { EmployeeCompensationController } from './employee-compensation.controller';
import { EmployeeCompensationService } from './employee-compensation.service';
import { EmployeeSalaryController } from './employee-salary.controller';
import { EmployeeSalaryService } from './employee-salary.service';
import { ExpenseClaimController } from './expense-claim.controller';
import { ExpenseClaimService } from './expense-claim.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payslip.name, schema: PayslipSchema },
      { name: PayslipComponent.name, schema: PayslipComponentSchema },
      { name: Dispute.name, schema: DisputeSchema },
      { name: EmployeeCompensation.name, schema: LeaveEncashmentSchema },
      { name: EmployeeSalary.name, schema: EmployeeSalarySchema },
      { name: ExpenseClaim.name, schema: ExpenseClaimSchema },
    ]),
  ],
  controllers: [
    PayrollTrackingController,
    DisputeController,
    EmployeeCompensationController,
    EmployeeSalaryController,
    ExpenseClaimController,
  ],
  providers: [
    PayrollTrackingService,
    DisputeService,
    EmployeeCompensationService,
    EmployeeSalaryService,
    ExpenseClaimService,
  ],
  exports: [
    PayrollTrackingService,
    DisputeService,
    EmployeeCompensationService,
    EmployeeSalaryService,
    ExpenseClaimService,
  ],
})
export class PayrollTrackingModule {}
