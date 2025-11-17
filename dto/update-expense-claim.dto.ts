import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseClaimDto } from './create-expense-claim.dto';

export class UpdateExpenseClaimDto extends PartialType(CreateExpenseClaimDto) {}
