import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromAddress: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get('EMAIL_ENABLED', 'true') === 'true';
    this.fromAddress = this.configService.get(
      'EMAIL_FROM',
      'LMS Platform <notifications@lms.example.com>',
    );

    if (this.enabled) {
      this.initializeTransporter();
    } else {
      this.logger.warn('Email service is disabled');
    }
  }

  private initializeTransporter(): void {
    const provider = this.configService.get('EMAIL_PROVIDER', 'smtp');

    switch (provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: this.configService.get('SENDGRID_API_KEY'),
          },
        });
        break;

      case 'aws-ses':
        this.transporter = nodemailer.createTransport({
          SES: {
            // AWS SES configuration would go here
            // Requires aws-sdk
          },
        });
        break;

      case 'smtp':
      default:
        this.transporter = nodemailer.createTransport({
          host: this.configService.get('SMTP_HOST', 'localhost'),
          port: parseInt(this.configService.get('SMTP_PORT', '587')),
          secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
          auth: {
            user: this.configService.get('SMTP_USER'),
            pass: this.configService.get('SMTP_PASS'),
          },
        });
        break;
    }

    this.logger.log(`Email transporter initialized using ${provider}`);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`Email would be sent to ${options.to}: ${options.subject}`);
      return;
    }

    try {
      const result = await this.transporter.sendMail({
        from: options.from || this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent to ${options.to}: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  async sendBulkEmails(options: EmailOptions[]): Promise<void> {
    // Send emails with rate limiting
    const batchSize = 100;
    const delayMs = 1000;

    for (let i = 0; i < options.length; i += batchSize) {
      const batch = options.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map((opt) =>
          this.sendEmail(opt).catch((err) => {
            this.logger.error(`Failed to send to ${opt.to}: ${err.message}`);
          }),
        ),
      );

      // Rate limiting delay
      if (i + batchSize < options.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error(`Email connection verification failed: ${error.message}`);
      return false;
    }
  }
}
