import { IsNumber, IsMongoId } from 'class-validator';

export class CreateEmployeeSalaryDto {
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  salary: number;

  @IsMongoId()
  ContractType: string;
}

