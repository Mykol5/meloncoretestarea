import { Module } from '@nestjs/common';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { ResponsesRepository } from './repository/responses.repository';
import { ReportsModule } from '../reports/reports.module';
import { ImpactMetricsModule } from '../impact-metrics/impact-metrics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ReportsModule, ImpactMetricsModule, AuthModule],
  controllers: [ResponsesController],
  providers: [
    ResponsesService,
    {
      provide: 'RESPONSES_REPOSITORY',
      useClass: ResponsesRepository,
    },
  ],
  exports: [ResponsesService],
})
export class ResponsesModule {}
