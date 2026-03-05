import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailTemplate } from '../interfaces/email.interface';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async addEmailToQueue(template: EmailTemplate, priority = 0): Promise<void> {
    try {
      await this.emailQueue.add('send-email', template, {
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      this.logger.log(`Email queued for ${template.to}`);
    } catch (error) {
      this.logger.error('Failed to queue email:', error);
      throw error;
    }
  }

  async addBulkEmails(templates: EmailTemplate[]): Promise<void> {
    const jobs = templates.map((template) => ({
      name: 'send-email',
      data: template,
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    }));

    await this.emailQueue.addBulk(jobs);
    this.logger.log(`${templates.length} emails queued for processing`);
  }

  // High priority emails (verification, password reset)
  async addUrgentEmail(template: EmailTemplate): Promise<void> {
    return this.addEmailToQueue(template, 10);
  }

  // Low priority emails (marketing, notifications)
  async addBulkEmail(template: EmailTemplate): Promise<void> {
    return this.addEmailToQueue(template, -10);
  }
}
