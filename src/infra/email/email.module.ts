import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProcessor } from './processors/email.processor';
import { ResendProvider } from './providers/resend.provider';
import { TemplateService } from './services/template.service';
import { EmailProvider } from './interfaces/email.interface';

@Module({
  imports: [
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
  providers: [
    EmailService,
    EmailQueueService,
    EmailProcessor,
    TemplateService,
    {
      provide: EmailProvider,
      useClass: ResendProvider,
    },
    {
      provide: 'EMAIL_PROVIDER',
      useClass: ResendProvider,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
