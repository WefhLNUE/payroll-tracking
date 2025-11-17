import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeCompensationDto } from './create-employee-compensation.dto';

export class UpdateEmployeeCompensationDto extends PartialType(
  CreateEmployeeCompensationDto,
) {}
