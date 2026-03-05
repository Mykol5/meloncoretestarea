import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repository/reports.repository';
import { ImpactMetricsModule } from '../impact-metrics/impact-metrics.module';
import { AuthModule } from '../auth/auth.module';
import { EmailService } from 'src/infra/email/email.service';
import { EmailQueueService } from 'src/infra/email/services/email-queue.service';
import { BullModule } from '@nestjs/bull';
import { ResendProvider } from 'src/infra/email/providers/resend.provider';

@Module({
  imports: [
    ImpactMetricsModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'email',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    EmailService,
    EmailQueueService,
    {
      provide: 'REPORTS_REPOSITORY',
      useClass: ReportsRepository,
    },
    {
      provide: 'EMAIL_PROVIDER',
      useClass: ResendProvider,
    },
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
