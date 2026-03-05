import { Module } from '@nestjs/common';
import { ImpactMetricsController } from './impact-metrics.controller';
import { ImpactMetricsService } from './impact-metrics.service';
import { ImpactMetricsRepository } from './repository/impact-metrics.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ImpactMetricsController],
  providers: [
    ImpactMetricsService,
    {
      provide: 'IMPACT_METRICS_REPOSITORY',
      useClass: ImpactMetricsRepository,
    },
  ],
  exports: [ImpactMetricsService],
})
export class ImpactMetricsModule {}
