import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ExpenseClaimService } from './expense-claim.service';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from './dto/update-expense-claim.dto';

@Controller('expense-claims')
export class ExpenseClaimController {
  constructor(private readonly expenseClaimService: ExpenseClaimService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateExpenseClaimDto) {
    return this.expenseClaimService.create(createDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.expenseClaimService.findByStatus(status);
    }
    return this.expenseClaimService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.expenseClaimService.findByEmployeeId(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseClaimService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateExpenseClaimDto) {
    return this.expenseClaimService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.expenseClaimService.remove(id);
  }
}

