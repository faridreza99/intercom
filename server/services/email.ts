import nodemailer from 'nodemailer';
import { type InvitationLog } from '@shared/schema';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface ReviewInvitationData {
  customerEmail: string;
  customerName: string;
  agentName: string;
  conversationId: string;
  businessName: string;
  reviewLink: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }

  private generateReviewEmailTemplate(data: ReviewInvitationData): { subject: string; html: string; text: string } {
    const subject = `Thanks for choosing ${data.businessName}! Share your experience`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Review Request</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #00d4aa 0%, #00b494 100%); 
          color: white; 
          text-align: center; 
          padding: 30px 20px;
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600;
        }
        .content { 
          padding: 30px; 
        }
        .agent-note {
          background: #f1f3f4;
          border-left: 4px solid #00d4aa;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .cta-button { 
          display: inline-block; 
          background: #00d4aa; 
          color: white; 
          text-decoration: none; 
          padding: 16px 32px; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .cta-button:hover { 
          background: #00b494; 
        }
        .stars {
          font-size: 24px;
          color: #ffd700;
          text-align: center;
          margin: 15px 0;
        }
        .footer { 
          text-align: center; 
          color: #666; 
          font-size: 14px; 
          padding: 20px;
          background: #f8f9fa;
        }
        .trustpilot-logo {
          color: #00d4aa;
          font-weight: bold;
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thanks for choosing ${data.businessName}!</h1>
          <p>Your feedback means everything to us</p>
        </div>
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>Thank you for your recent interaction with our team. ${data.agentName} was delighted to assist you!</p>
          
          <div class="agent-note">
            <strong>From your support agent ${data.agentName}:</strong><br>
            "It was my pleasure helping you today. Your experience matters to us, and we'd love to hear about your journey with ${data.businessName}!"
          </div>

          <p>Would you mind taking 2 minutes to share your experience? Your honest review helps us improve and helps other customers discover our services.</p>

          <div class="stars">★★★★★</div>
          
          <div style="text-align: center;">
            <a href="${data.reviewLink}" class="cta-button" target="_blank">
              Write Your Review on Trustpilot
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Why Trustpilot?</strong><br>
            Trustpilot is an independent review platform that helps businesses like ours build trust with genuine customer feedback.
          </p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent because you recently completed a conversation with our support team.</p>
          <p class="trustpilot-logo">Powered by Trustpilot Reviews</p>
          <p style="font-size: 12px;">Conversation ID: ${data.conversationId}</p>
        </div>
      </div>
    </body>
    </html>`;

    const text = `
Hi ${data.customerName},

Thank you for your recent interaction with our team. ${data.agentName} was delighted to assist you!

Your experience matters to us, and we'd love to hear about your journey with ${data.businessName}.

Would you mind taking 2 minutes to share your experience? Your honest review helps us improve and helps other customers discover our services.

Write your review here: ${data.reviewLink}

Thanks again for choosing ${data.businessName}!

Conversation ID: ${data.conversationId}
    `.trim();

    return { subject, html, text };
  }

  async sendReviewInvitation(data: ReviewInvitationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { subject, html, text } = this.generateReviewEmailTemplate(data);

      const result = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: data.customerEmail,
        subject: subject,
        text: text,
        html: html,
      });

      console.log('Review invitation email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Failed to send review invitation email:', error);
      return { success: false, error: error.message };
    }
  }
}

export function createEmailService(): EmailService {
  const port = parseInt(process.env.SMTP_PORT || '587');
  const config: SMTPConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true', // SSL for port 465, STARTTLS for 587
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
    fromName: process.env.SMTP_FROM_NAME || 'Customer Success Team',
  };

  if (!config.user || !config.password) {
    throw new Error('Missing required SMTP environment variables: SMTP_USER and SMTP_PASSWORD');
  }

  return new EmailService(config);
}