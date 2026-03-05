import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { EmailTemplate, EmailProvider } from '../interfaces/email.interface';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject('EMAIL_PROVIDER')
    private readonly emailProvider: EmailProvider,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailTemplate>) {
    const { data: template } = job;

    try {
      this.logger.log(`Processing email for ${template.to}`);

      const result = await this.emailProvider.sendEmail(template);

      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      this.logger.log(`Email sent successfully: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${template.to}:`, error);
      throw error; // This will trigger retry logic
    }
  }
}
