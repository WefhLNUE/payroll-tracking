# Payroll Tracking Module

This module provides CRUD operations for managing payroll-related data in the HR system, including payslips, disputes, employee compensations, employee salaries, and expense claims.

## Features

- **Payslips**: Create, read, update, and delete payslip records
- **Disputes**: Manage payroll disputes with status tracking
- **Employee Compensations**: Handle leave encashment and compensation requests
- **Employee Salaries**: Manage employee salary records
- **Expense Claims**: Process and track employee expense claims
- Full validation of all data
- Query by employee ID, status, and other filters

## API Endpoints

### Payslips

#### Create Payslip

```
POST /payroll-tracking
```

Creates a new payslip record.

#### Get All Payslips

```
GET /payroll-tracking
```

#### Get Payslip by ID

```
GET /payroll-tracking/:id
```

#### Get Payslips by Employee ID

```
GET /payroll-tracking/employee/:employeeId
```

#### Get Payslips by Payroll Run ID

```
GET /payroll-tracking/payroll-run/:payrollRunId
```

#### Update Payslip

```
PATCH /payroll-tracking/:id
```

#### Delete Payslip

```
DELETE /payroll-tracking/:id
```

### Disputes

#### Create Dispute

```
POST /disputes
```

Creates a new payroll dispute.

**Request Body:**

```json
{
  "employeeId": "string (MongoDB ObjectId)",
  "category": "salary | overtime | deduction | allowance | attendance | bonus | commission | final_settlement | other",
  "description": "string",
  "status": "pending | under_review | resolved | rejected",
  "managerComment": "string (optional)",
  "payrollComment": "string (optional)",
  "resolutionDetails": "string (optional)",
  "resolvedAt": "ISO date string (optional)"
}
```

#### Get All Disputes

```
GET /disputes
```

#### Get Disputes by Status

```
GET /disputes?status=pending
```

#### Get Disputes by Employee ID

```
GET /disputes/employee/:employeeId
```

#### Get Dispute by ID

```
GET /disputes/:id
```

#### Update Dispute

```
PATCH /disputes/:id
```

#### Delete Dispute

```
DELETE /disputes/:id
```

### Employee Compensations (Leave Encashment)

#### Create Employee Compensation

```
POST /employee-compensations
```

Creates a new leave encashment/compensation record.

**Request Body:**

```json
{
  "employeeId": "string (MongoDB ObjectId)",
  "leaveType": "annual | sick | other",
  "days": "number (min: 0)",
  "amount": "number (min: 0)",
  "baseSalaryAtCalculation": "number (min: 0)",
  "divisor": "number (min: 1)",
  "status": "pending | approved | rejected | paid",
  "note": "string (optional)"
}
```

#### Get All Employee Compensations

```
GET /employee-compensations
```

#### Get Compensations by Status

```
GET /employee-compensations?status=pending
```

#### Get Compensations by Employee ID

```
GET /employee-compensations/employee/:employeeId
```

#### Get Compensation by ID

```
GET /employee-compensations/:id
```

#### Update Employee Compensation

```
PATCH /employee-compensations/:id
```

#### Delete Employee Compensation

```
DELETE /employee-compensations/:id
```

### Employee Salaries

#### Create Employee Salary

```
POST /employee-salaries
```

Creates a new employee salary record.

**Request Body:**

```json
{
  "employeeId": "string (MongoDB ObjectId)",
  "salary": "number",
  "ContractType": "string (MongoDB ObjectId)"
}
```

#### Get All Employee Salaries

```
GET /employee-salaries
```

#### Get Salaries by Employee ID

```
GET /employee-salaries/employee/:employeeId
```

#### Get Employee Salary by ID

```
GET /employee-salaries/:id
```

#### Update Employee Salary

```
PATCH /employee-salaries/:id
```

#### Delete Employee Salary

```
DELETE /employee-salaries/:id
```

### Expense Claims

#### Create Expense Claim

```
POST /expense-claims
```

Creates a new expense claim.

**Request Body:**

```json
{
  "employeeId": "string (MongoDB ObjectId)",
  "amount": "number",
  "type": "string (e.g., 'travel', 'meal', 'accommodation')",
  "description": "string (optional)",
  "receipts": ["string array (URLs to documents)"],
  "status": "Specialist_Approved | Secialist_Rejected | Manager_Approved | Manager_Rejected | Refund_Scheduled | Paid_In_Payroll",
  "approvedAt": "ISO date string (optional)"
}
```

#### Get All Expense Claims

```
GET /expense-claims
```

#### Get Expense Claims by Status

```
GET /expense-claims?status=Manager_Approved
```

#### Get Expense Claims by Employee ID

```
GET /expense-claims/employee/:employeeId
```

#### Get Expense Claim by ID

```
GET /expense-claims/:id
```

#### Update Expense Claim

```
PATCH /expense-claims/:id
```

#### Delete Expense Claim

```
DELETE /expense-claims/:id
```

## Models

### Payslip

- `employeeId`: Reference to Employee
- `payrollRunId`: Reference to PayrollRun
- `type`: Type of payslip (enum)
- `status`: Status of payslip (enum)
- `periodLabel`: Label for the pay period
- `periodStart`: Start date of pay period
- `periodEnd`: End date of pay period
- `processedAt`: When the payslip was processed
- `effectiveDate`: Effective date of the payslip
- `currency`: Currency code
- `baseSalary`: Base salary amount
- `allowancesTotal`: Total allowances
- `grossSalary`: Gross salary amount
- `taxesTotal`: Total taxes
- `insuranceTotal`: Total insurance deductions
- `otherDeductionsTotal`: Other deductions
- `employerContributionsTotal`: Employer contributions
- `netSalary`: Net salary amount
- `components`: Array of payslip components
- `pdfUrl`: URL to PDF document (optional)

### Dispute

- `employeeId`: Reference to Employee
- `category`: Category of dispute (enum)
- `description`: Description of the dispute
- `status`: Status of dispute (enum)
- `managerComment`: Manager's comment (optional)
- `payrollComment`: Payroll team's comment (optional)
- `resolutionDetails`: Details of resolution (optional)
- `resolvedAt`: Date when dispute was resolved (optional)

### EmployeeCompensation

- `employeeId`: Reference to User/Employee
- `leaveType`: Type of leave (annual, sick, other)
- `days`: Number of days to encash
- `amount`: Monetary amount for encashment
- `baseSalaryAtCalculation`: Salary snapshot used for calculation
- `divisor`: Number of working days used as divisor
- `status`: Status of encashment request (enum)
- `note`: Additional notes (optional)

### EmployeeSalary

- `employeeId`: Reference to Employee
- `salary`: Salary amount
- `ContractType`: Reference to ContractType

### ExpenseClaim

- `employeeId`: Reference to Employee
- `amount`: Expense amount
- `type`: Type of expense (e.g., travel, meal, accommodation)
- `description`: Description of expense (optional)
- `receipts`: Array of receipt URLs (optional)
- `status`: Status of expense claim (enum)
- `approvedAt`: Date when approved (optional)

## Error Handling

The module returns appropriate HTTP status codes:

- `200 OK`: Successful GET/PATCH request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid input data or invalid ID format
- `404 Not Found`: Record not found

## Usage

The module is automatically imported in `AppModule`. All endpoints are available at their respective paths:

- `/payroll-tracking` - Payslips
- `/disputes` - Disputes
- `/employee-compensations` - Employee Compensations
- `/employee-salaries` - Employee Salaries
- `/expense-claims` - Expense Claims
