import { forwardRef, Module } from '@nestjs/common';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { refunds, refundsSchema } from './Models/refunds.schema';
import { claims, claimsSchema } from './Models/claims.schema';
import { disputes, disputesSchema } from './Models/disputes.schema';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';
import { TimeManagementModule } from 'src/time-management/time-management.module';

@Module({
  
  imports: [
    PayrollConfigurationModule,forwardRef(()=> PayrollExecutionModule),
    TimeManagementModule,
    MongooseModule.forFeature([
      { name: refunds.name, schema: refundsSchema },
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
    ])],
  controllers: [PayrollTrackingController],
  providers: [PayrollTrackingService],
  exports:[PayrollTrackingService]
})
export class PayrollTrackingModule { }
