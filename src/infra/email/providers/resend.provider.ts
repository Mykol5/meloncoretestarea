import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailProvider, EmailTemplate } from '../interfaces/email.interface';

@Injectable()
export class ResendProvider extends EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private resend: Resend;
  private readonly fromEmail = 'noreply@melon.ng';
  private readonly fromName = 'Melon Solutions';

  constructor() {
    super();
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY not found, using fallback mode');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(template: EmailTemplate): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Fallback mode for development
      if (!process.env.RESEND_API_KEY) {
        this.logger.log('=== EMAIL FALLBACK MODE ===');
        this.logger.log(`To: ${template.to}`);
        this.logger.log(`Subject: ${template.subject}`);
        this.logger.log(`Template: ${template.templateName}`);
        this.logger.log(`Data:`, template.templateData);
        return { success: true, messageId: 'fallback-' + Date.now() };
      }

      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`, // ← UPDATED: Now uses noreply@melon.ng
        to: Array.isArray(template.to) ? template.to : [template.to],
        subject: template.subject,
        html: await this.renderTemplate(
          template.templateName,
          template.templateData,
        ),
        replyTo:
          template.replyTo || process.env.SUPPORT_EMAIL || 'dev@melon.ng',
        attachments: template.attachments,
      });

      if (error) {
        this.logger.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  private async renderTemplate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<string> {
    const { renderTemplate } = await import('../services/template.service');
    return renderTemplate(templateName, data);
  }
}
