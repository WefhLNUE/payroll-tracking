import { Injectable } from '@nestjs/common';
import {
  dummyPayslips,
  dummyExpenseClaims,
  dummyDisputes,
  dummyCompensations,
  dummySalaries,
} from './payroll-tracking.dummy';

@Injectable()
export class PayrollTrackingService {
  getPayslips(employeeId: string) {
    return dummyPayslips.filter((p) => p.employeeId === employeeId);
  }

  getExpenseClaims(employeeId: string) {
    return dummyExpenseClaims.filter((e) => e.employeeId === employeeId);
  }

  getDisputes(employeeId: string) {
    return dummyDisputes.filter((d) => d.employeeId === employeeId);
  }

  getCompensations(employeeId: string) {
    return dummyCompensations.filter((c) => c.employeeId === employeeId);
  }

  getSalary(employeeId: string) {
    return dummySalaries.find((s) => s.employeeId === employeeId);
  }
}
