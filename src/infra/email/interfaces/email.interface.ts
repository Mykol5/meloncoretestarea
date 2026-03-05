export interface EmailTemplate {
  to: string | string[];
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export abstract class EmailProvider {
  abstract sendEmail(template: EmailTemplate): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export enum EmailTemplateType {
  VERIFICATION = 'EMAIL_VERIFICATION',
  INVITATION = 'USER_INVITATION',
  UPGRADE_NOTIFICATION = 'UPGRADE_NOTIFICATION',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  BILLING_SUCCESS = 'BILLING_SUCCESS',
  BILLING_FAILED = 'BILLING_FAILED',
  TRIAL_EXPIRING = 'TRIAL_EXPIRING',
  REPORT_SHARE = 'REPORT_SHARE',
}
