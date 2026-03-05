import { Injectable, Logger, Inject } from '@nestjs/common';
import { EmailQueueService } from './services/email-queue.service';
import { EmailTemplateType, EmailProvider } from './interfaces/email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly emailQueueService: EmailQueueService,
    @Inject('EMAIL_PROVIDER')
    private readonly emailProvider: EmailProvider,
  ) {}

  async sendEmailDirectly(template: {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    replyTo?: string;
  }): Promise<void> {
    try {
      this.logger.log(`Sending email directly to ${template.to}`);

      const result = await this.emailProvider.sendEmail(template);

      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      this.logger.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      this.logger.error('Direct email send failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    await this.sendEmailDirectly({
      to: email,
      subject: 'Verify Your Email - Melon Solutions',
      templateName: EmailTemplateType.VERIFICATION,
      templateData: {
        firstName,
        verificationUrl,
        companyName: 'Melon Solutions',
      },
    });

    this.logger.log(`Verification email sent to ${email}`);
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    inviterName: string,
    organizationName: string,
  ): Promise<void> {
    const invitationUrl = `${process.env.FRONTEND_URL}/auth/accept-invitation?token=${token}`;

    await this.sendEmailDirectly({
      to: email,
      subject: `You're invited to join ${organizationName} on Melon`,
      templateName: EmailTemplateType.INVITATION,
      templateData: {
        inviterName,
        organizationName,
        invitationUrl,
        companyName: 'Melon Solutions',
      },
    });

    this.logger.log(`Invitation email sent to ${email}`);
  }

  async sendUpgradeNotification(
    ownerEmail: string,
    ownerName: string,
    blockedUserEmail: string,
    organizationName: string,
  ): Promise<void> {
    const upgradeUrl = `${process.env.FRONTEND_URL}/billing/upgrade`;

    await this.emailQueueService.addEmailToQueue(
      {
        to: ownerEmail,
        subject: `${blockedUserEmail} wants to join your team on Melon`,
        templateName: EmailTemplateType.UPGRADE_NOTIFICATION,
        templateData: {
          ownerName,
          blockedUserEmail,
          organizationName,
          upgradeUrl,
          companyName: 'Melon Solution',
        },
      },
      5,
    ); // Medium priority

    this.logger.log(`Upgrade notification queued for ${ownerEmail}`);
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    organizationName: string,
  ): Promise<void> {
    await this.emailQueueService.addEmailToQueue(
      {
        to: email,
        subject: `Welcome to ${organizationName} on Melon!`,
        templateName: EmailTemplateType.WELCOME,
        templateData: {
          firstName,
          organizationName,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          companyName: 'Melon Solutions',
        },
      },
      0,
    ); // Normal priority

    this.logger.log(`Welcome email queued for ${email}`);
  }

  async sendTrialExpiringEmail(
    email: string,
    firstName: string,
    organizationName: string,
    daysLeft: number,
  ): Promise<void> {
    await this.emailQueueService.addEmailToQueue(
      {
        to: email,
        subject: `Your Melon trial expires in ${daysLeft} days`,
        templateName: EmailTemplateType.TRIAL_EXPIRING,
        templateData: {
          firstName,
          organizationName,
          daysLeft,
          upgradeUrl: `${process.env.FRONTEND_URL}/billing/upgrade`,
          companyName: 'Melon Solutions',
        },
      },
      7,
    ); // High priority

    this.logger.log(`Trial expiring email queued for ${email}`);
  }

  // Bulk operations for marketing
  async sendBulkNotifications(
    emails: Array<{ email: string; templateData: Record<string, any> }>,
    templateName: EmailTemplateType,
    subject: string,
  ): Promise<void> {
    const templates = emails.map(({ email, templateData }) => ({
      to: email,
      subject,
      templateName,
      templateData,
    }));

    await this.emailQueueService.addBulkEmails(templates);
    this.logger.log(`${emails.length} bulk emails queued`);
  }

  async sendReportShare(
    recipients: string[],
    reportData: {
      id: string;
      title: string;
      description?: string;
      questionCount: number;
      responseCount: number;
      shareUrl: string;
      isPublic: boolean;
    },
    senderData: {
      name: string;
      email: string;
    },
    personalMessage?: string,
  ): Promise<void> {
    const estimatedTime = Math.max(
      2,
      Math.ceil(reportData.questionCount * 0.5),
    );

    const templateData = {
      senderName: senderData.name,
      senderEmail: senderData.email,
      reportTitle: reportData.title,
      reportDescription: reportData.description,
      reportUrl: reportData.shareUrl,
      questionCount: reportData.questionCount,
      responseCount: reportData.responseCount,
      estimatedTime,
      isPublic: reportData.isPublic,
      personalMessage,
      companyName: 'Melon Solutions',
      year: new Date().getFullYear(),
      marketingUrl: process.env.MARKETING_URL || 'https://melon.ng',
      supportEmail: process.env.SUPPORT_EMAIL || 'dev@melon.ng',
      logoUrl: `${process.env.FRONTEND_URL}/images/melon-logo-white.png`,
    };

    const emailPromises = recipients.map(async (email) => {
      return this.sendEmailDirectly({
        to: email,
        subject: `📊 ${senderData.name} shared "${reportData.title}" with you`,
        templateName: EmailTemplateType.REPORT_SHARE,
        templateData,
        replyTo: senderData.email,
      });
    });

    await Promise.all(emailPromises);

    this.logger.log(
      `Report sharing emails sent directly to ${recipients.length} recipients`,
    );
  }
}
