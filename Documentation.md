# Payroll Tracking API Documentation

## Overview

The Payroll Tracking API provides endpoints for employees, payroll specialists, managers, HR, and finance staff to manage payslips, deductions, claims, disputes, refunds, and payroll reports.

**Base Path:** `/payroll-tracking`

**Authentication:** JWT (via `JwtAuthGuard`)

**Authorization:** Role-based access control using `RolesGuard`

---

## Roles

- **DEPARTMENT_EMPLOYEE** – Employee self-service
- **PAYROLL_SPECIALIST** – Payroll review and first-level approvals
- **PAYROLL_MANAGER** – Final approvals and oversight
- **HR_MANAGER** – Oversight and reporting
- **FINANCE_STAFF** – Refund processing and finance reports

---

## Employee Self‑Service Endpoints

### View My Latest Payslip

`GET /my-payslip`

Returns the most recent payslip for the logged-in employee.

---

### View My Payslip History

`GET /my-payslips`

Returns all payslips belonging to the logged-in employee.

---

### Download Latest Payslip (PDF)

`GET /download-payslip`

Downloads the most recent payslip as a PDF file.

---

### Payslip Status History

`GET /my-payslip-status`

Returns historical status changes of employee payslips.

---

### Base Salary

`GET /base-salary`

Returns base salary details.

---

### Unused Leave Compensation

`GET /unused-leave-compensation`

Returns compensation for unused leave days.

---

### Transportation Compensation

`GET /transport-compensation`

Returns transportation allowance details.

---

### Detailed Tax Deductions

`GET /tax-deduction/:payslipId`

Returns detailed tax deductions for a specific payslip.

---

### Insurance Deductions

`GET /insurance-deductions`

Returns insurance deduction breakdown.

---

### Misconduct / Absence Deductions

`GET /misconduct-deductions`

Returns deductions due to misconduct or absence.

---

### Unpaid Leave Deductions

`GET /unpaid-leave-deductions`

Returns deductions related to unpaid leave.

---

### Salary History

`GET /salary-history`

Returns salary progression over time.

---

### Employer Contributions

`GET /employer-contributions`

Returns employer-paid contributions (insurance, benefits, etc.).

---

### Download Tax Rules (PDF)

`GET /download-tax-rules`

Downloads the official tax rules document.

---

## Claims & Disputes (Employee)

### Submit Expense Claim

`POST /expense-claims`

**Body:**

```json
{
  "description": "Taxi reimbursement",
  "claimType": "transport",
  "amount": 200
}
```

---

### Submit Payroll Dispute

`POST /disputes`

**Body:**

```json
{
  "payslipId": "<payslipId>",
  "description": "Incorrect overtime calculation"
}
```

---

### View My Claims

`GET /my-claims`

---

### View My Disputes

`GET /my-disputes`

---

## Payroll Specialist & Manager Operations

### Payslips by Department

`POST /payslips/bydepartment`

**Body:**

```json
{
  "departmentId": "<departmentId>",
  "payrollRunId": "<payrollRunId>"
}
```

---

### Payroll Runs by Month

`GET /payroll-runs/month/:month/:year`

---

### Payroll Runs by Year

`GET /payroll-runs/year/:year`

---

### Finance Report by Year

`GET /finance-report/:year`

Returns aggregated finance data for the year.

---

## Dispute & Claim Review Workflow

### Specialist Review Lists

- `GET /disputes/for-specialist-review`
- `GET /claims/for-specialist-review`

---

### Manager Approval Lists

- `GET /disputes/for-manager-approval`
- `GET /claims/for-manager-approval`

---

### Specialist Approve / Reject Dispute

- `POST /dispute/:disputeId/specialist-approve`
- `POST /dispute/:disputeId/specialist-reject`

---

### Manager Approve / Reject Dispute

- `POST /dispute/:disputeId/manager-confirm`
- `POST /dispute/:disputeId/manager-reject`

---

### Specialist Approve / Reject Claim

- `POST /claim/:claimId/specialist-approve`
- `POST /claim/:claimId/specialist-reject`

---

### Manager Approve / Reject Claim

- `POST /claim/:claimId/manager-confirm`
- `POST /claim/:claimId/manager-reject`

---

## Refund Management (Finance Staff)

### Create Refund

`POST /refund/create`

**Body:**

```json
{
  "type": "dispute",
  "recordId": "<recordId>",
  "refundAmount": 500,
  "description": "Overpaid tax"
}
```

---

### Pending Refunds

`GET /refunds/pending`

---

### Mark Refund as Paid

`POST /refund/:refundId/mark-paid`

**Body:**

```json
{
  "payrollRunId": "<payrollRunId>"
}
```

---

### Refunds by Payroll Run

`GET /refunds/payroll-run/:payrollRunId`

---

### All Refunds

`GET /refunds`

---

### Employee Refunds / Claims / Disputes

- `GET /employee/:employeeId/refunds`
- `GET /employee/:employeeId/claims`
- `GET /employee/:employeeId/disputes`

---

## Operational Reports

### Department Payroll Summary

`GET /reports/department-summary/:departmentId/:year/:month`

---

### Dispute Statistics

`GET /reports/dispute-stats/:year/:month`

---

### Claim Statistics

`GET /reports/claim-stats/:year/:month`

---

## Notes

- All IDs are MongoDB ObjectIds
- JWT must be included in `Authorization: Bearer <token>` header
- Unauthorized access returns **403 Forbidden**

---

**End of Documentation**
