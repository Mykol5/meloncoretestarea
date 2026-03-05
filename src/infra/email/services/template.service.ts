import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TemplateService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.loadTemplates();
    this.registerHelpers();
  }

  private loadTemplates() {
    const templateDir = join(process.cwd(), 'src/infra/email/templates');

    const templateFiles = [
      'EMAIL_VERIFICATION',
      'USER_INVITATION',
      'UPGRADE_NOTIFICATION',
      'WELCOME',
      'PASSWORD_RESET',
      'BILLING_SUCCESS',
      'BILLING_FAILED',
      'TRIAL_EXPIRING',
      'REPORT_SHARE',
    ];

    templateFiles.forEach((templateName) => {
      try {
        const templatePath = join(templateDir, `${templateName}.hbs`);
        const templateSource = readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateSource);
        this.templates.set(templateName, template);
      } catch (error) {
        console.warn(`Template ${templateName} not found, using fallback`);
        this.templates.set(
          templateName,
          this.getFallbackTemplate(templateName),
        );
      }
    });
  }

  private registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date));
    });

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount / 100); // Convert cents to dollars
    });
  }

  renderTemplate(templateName: string, data: Record<string, any>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    return template({
      ...data,
      year: new Date().getFullYear(),
      companyName: 'Melon Solutions',
      supportEmail: process.env.SUPPORT_EMAIL,
      marketingUrl: process.env.MARKETING_URL,
    });
  }

  private getFallbackTemplate(
    templateName: string,
  ): HandlebarsTemplateDelegate {
    // Fallback HTML templates for development
    const fallbackTemplates = {
      EMAIL_VERIFICATION: `
      <h2>Welcome to Melon!</h2>
      <p>Hi {{firstName}},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="{{verificationUrl}}" style="background: #5B94E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
    `,
      USER_INVITATION: `
      <h2>You're invited to join {{organizationName}}</h2>
      <p>{{inviterName}} has invited you to collaborate on Melon.</p>
      <a href="{{invitationUrl}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
    `,
      UPGRADE_NOTIFICATION: `
      <h2>{{blockedUserEmail}} wants to join your team</h2>
      <p>Hi {{ownerName}},</p>
      <p>Your organization needs to upgrade to add more team members.</p>
      <a href="{{upgradeUrl}}" style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Upgrade Plan</a>
    `,
      REPORT_SHARE: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #5B94E5; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Melon Solutions</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Transform data into measurable impact</p>
        </div>
        <div style="padding: 30px;">
          <h2>📊 {{senderName}} shared a report with you</h2>
          <p>{{#if personalMessage}}{{personalMessage}}{{else}}You've been invited to view and respond to an impact assessment report.{{/if}}</p>
          
          <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f8fafc;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{reportTitle}}</h3>
            {{#if reportDescription}}<p style="color: #6b7280; margin: 0 0 15px 0;">{{reportDescription}}</p>{{/if}}
            <p style="font-size: 14px; color: #6b7280;">{{questionCount}} questions • ~{{estimatedTime}} minutes</p>
            <a href="{{reportUrl}}" style="display: inline-block; background: #5B94E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Fill Out Report</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">Can't click the button? Copy this link: {{reportUrl}}</p>
        </div>
      </div>
    `,
    };

    return Handlebars.compile(
      fallbackTemplates[templateName] || '<p>{{message}}</p>',
    );
  }
}

export function renderTemplate(
  templateName: string,
  data: Record<string, any>,
): string {
  const templateService = new TemplateService();
  return templateService.renderTemplate(templateName, data);
}
