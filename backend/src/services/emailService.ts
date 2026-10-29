import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';
import { EventRegistration } from '../models/EventRegistration';

export interface TicketEmailPayload {
  toEmail: string;
  participantName: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  ticketUrl: string;
  qrCodeDataUrl: string;
  registrationId: string;
}

export class EmailService {
  private static resendClient: Resend | null = null;
  private static smtpTransporter: Transporter | null = null;

  public static getStatus(): { configured: boolean; provider: 'resend' | 'smtp' | 'none'; details: string } {
    if (ENV.RESEND_API_KEY && ENV.RESEND_API_KEY.trim() !== '') {
      return {
        configured: true,
        provider: 'resend',
        details: `Configured with Resend API (Sender: ${ENV.EMAIL_FROM})`,
      };
    }
    if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
      return {
        configured: true,
        provider: 'smtp',
        details: `Configured with SMTP (${ENV.SMTP_HOST}:${ENV.SMTP_PORT})`,
      };
    }
    return {
      configured: false,
      provider: 'none',
      details: 'No email credentials configured. Please set RESEND_API_KEY (or SMTP credentials) in backend/.env',
    };
  }

  private static getResendClient(): Resend | null {
    if (!this.resendClient && ENV.RESEND_API_KEY && ENV.RESEND_API_KEY.trim() !== '') {
      this.resendClient = new Resend(ENV.RESEND_API_KEY.trim());
    }
    return this.resendClient;
  }

  private static getSmtpTransporter(): Transporter | null {
    if (!this.smtpTransporter && ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
      this.smtpTransporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_SECURE,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });
    }
    return this.smtpTransporter;
  }

  /**
   * Generates high-fidelity HTML email template with BacktoBase branding
   */
  public static generateTicketEmailHtml(payload: TicketEmailPayload): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BacktoBase Event Ticket</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #08090c; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #11141c; border-radius: 16px; border: 1px solid #272d3f; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #12151c 0%, #1a1e2b 100%); padding: 35px 25px; text-align: center; border-bottom: 2px solid #00e5ff;">
              <!-- BacktoBase Wordmark & Branding -->
              <div style="margin-bottom: 8px;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 1px; color: #e6be6d; text-shadow: 0 2px 4px rgba(0,0,0,0.4);">BACK</span>
                <span style="font-size: 16px; font-weight: 700; color: #94a3b8; margin: 0 6px;">TO</span>
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 1px; color: #00e5ff; text-shadow: 0 0 12px rgba(0,229,255,0.4);">BASE</span>
              </div>
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                LEGENDS UPGRADE
              </div>
            </td>
          </tr>

          <!-- Ticket Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 10px 0; font-weight: 700;">
                Hello, <span style="color: #00e5ff;">${payload.participantName}</span>!
              </h2>
              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Here is your official pass for the <strong>BacktoBase Mega Event</strong>. Please present the QR code below at the volunteer check-in gate.
              </p>

              <!-- Event Details Box -->
              <table role="presentation" width="100%" style="background-color: #171b26; border: 1px solid #272d3f; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #e6be6d; font-weight: 700; margin-bottom: 6px;">
                      EVENT DETAILS
                    </div>
                    <div style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">
                      ${payload.eventName}
                    </div>
                    <div style="font-size: 14px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4;">
                      ${payload.eventDescription}
                    </div>
                    <div style="font-size: 13px; color: #00e5ff; font-weight: 600;">
                      📅 Date: <span style="color: #ffffff;">${payload.eventDate}</span>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                      Pass ID: <span style="font-family: monospace; color: #e6be6d;">${payload.registrationId}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- QR Code Card -->
              <div style="text-align: center; background-color: #ffffff; border-radius: 16px; padding: 24px; max-width: 280px; margin: 0 auto 25px auto; box-shadow: 0 8px 24px rgba(0,229,255,0.15);">
                <img src="${payload.qrCodeDataUrl}" alt="Event QR Ticket" width="220" height="220" style="display: block; margin: 0 auto; border-radius: 8px;" />
                <div style="margin-top: 14px; font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  Scan at Entrance
                </div>
              </div>

              <!-- View Ticket Online Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${payload.ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%); color: #08090c; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  Open Digital Ticket Pass
                </a>
              </div>

              <!-- Instructions & Support -->
              <div style="background-color: #171b26; border-left: 3px solid #e6be6d; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <div style="font-size: 13px; font-weight: 700; color: #e6be6d; margin-bottom: 4px;">Important Instructions</div>
                <div style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  • Each ticket is unique and valid for a single check-in.<br/>
                  • Ensure screen brightness is high when presenting the QR code on mobile.<br/>
                  • For assistance, contact the BacktoBase Event Desk at the entrance.
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0d0f15; padding: 20px 30px; text-align: center; border-top: 1px solid #272d3f; font-size: 12px; color: #64748b;">
              &copy; ${new Date().getFullYear()} BacktoBase Mega Event. All rights reserved.<br/>
              <em>LEGENDS UPGRADE</em>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Send a ticket email to a registered participant
   */
  public static async sendTicketEmail(
    registrationDbId: string,
    payload: TicketEmailPayload
  ): Promise<{ success: boolean; message: string }> {
    const resend = this.getResendClient();
    const smtp = this.getSmtpTransporter();

    // 1. If Resend configured
    if (resend) {
      try {
        const htmlContent = this.generateTicketEmailHtml(payload);
        const { data, error } = await resend.emails.send({
          from: ENV.EMAIL_FROM,
          to: payload.toEmail,
          subject: `Your BacktoBase Ticket: ${payload.eventName}`,
          html: htmlContent,
        });

        if (error) {
          logger.error(`Resend send failed for ${payload.toEmail}:`, error);
          await EventRegistration.findByIdAndUpdate(registrationDbId, {
            emailStatus: 'failed',
            emailError: error.message || 'Resend API error',
          });
          return { success: false, message: `Email delivery failed: ${error.message}` };
        }

        logger.info(`Ticket email sent via Resend to ${payload.toEmail}, id: ${data?.id}`);
        await EventRegistration.findByIdAndUpdate(registrationDbId, {
          emailStatus: 'sent',
          emailError: null,
        });
        return { success: true, message: `Ticket email successfully sent to ${payload.toEmail}.` };
      } catch (err: any) {
        logger.error(`Exception sending via Resend to ${payload.toEmail}:`, err);
        await EventRegistration.findByIdAndUpdate(registrationDbId, {
          emailStatus: 'failed',
          emailError: err.message || 'Resend delivery exception',
        });
        return { success: false, message: `Resend error: ${err.message}` };
      }
    }

    // 2. If SMTP configured (e.g. Gmail / Outlook / Custom SMTP)
    if (smtp) {
      try {
        const htmlContent = this.generateTicketEmailHtml(payload);
        await smtp.sendMail({
          from: ENV.EMAIL_FROM,
          to: payload.toEmail,
          subject: `Your BacktoBase Ticket: ${payload.eventName}`,
          html: htmlContent,
        });

        logger.info(`Ticket email sent via SMTP to ${payload.toEmail}`);
        await EventRegistration.findByIdAndUpdate(registrationDbId, {
          emailStatus: 'sent',
          emailError: null,
        });
        return { success: true, message: `Ticket email sent via SMTP to ${payload.toEmail}.` };
      } catch (err: any) {
        logger.error(`Exception sending via SMTP to ${payload.toEmail}:`, err);
        await EventRegistration.findByIdAndUpdate(registrationDbId, {
          emailStatus: 'failed',
          emailError: err.message || 'SMTP delivery exception',
        });
        return { success: false, message: `SMTP error: ${err.message}` };
      }
    }

    // 3. Fallback when live email provider is not yet configured
    const soonMsg = 'This feature will be available soon! Email dispatch queued for attendees.';
    logger.info(`[EMAIL SERVICE] ${soonMsg} (Target: ${payload.toEmail})`);
    await EventRegistration.findByIdAndUpdate(registrationDbId, {
      emailStatus: 'pending',
      emailError: null,
    });
    return {
      success: true,
      message: soonMsg,
    };
  }

  /**
   * Send test email to verify credentials
   */
  public static async sendTestEmail(targetEmail: string): Promise<{ success: boolean; message: string }> {
    const resend = this.getResendClient();
    const smtp = this.getSmtpTransporter();

    if (!resend && !smtp) {
      return {
        success: false,
        message: 'No email service configured. Please set RESEND_API_KEY (or SMTP credentials) in backend/.env',
      };
    }

    const testHtml = `
      <div style="font-family: sans-serif; background: #08090c; color: white; padding: 30px; border-radius: 12px;">
        <h2 style="color: #00e5ff;">BacktoBase Test Email</h2>
        <p>Congratulations! Your email dispatch service is configured and delivering messages successfully.</p>
        <p style="color: #e6be6d; font-weight: bold;">LEGENDS UPGRADE</p>
      </div>
    `;

    if (resend) {
      try {
        const { error } = await resend.emails.send({
          from: ENV.EMAIL_FROM,
          to: targetEmail,
          subject: 'BacktoBase Email Delivery Test',
          html: testHtml,
        });
        if (error) return { success: false, message: `Resend test error: ${error.message}` };
        return { success: true, message: `Test email successfully sent to ${targetEmail} via Resend!` };
      } catch (err: any) {
        return { success: false, message: `Resend test error: ${err.message}` };
      }
    }

    if (smtp) {
      try {
        await smtp.sendMail({
          from: ENV.EMAIL_FROM,
          to: targetEmail,
          subject: 'BacktoBase Email Delivery Test',
          html: testHtml,
        });
        return { success: true, message: `Test email successfully sent to ${targetEmail} via SMTP!` };
      } catch (err: any) {
        return { success: false, message: `SMTP test error: ${err.message}` };
      }
    }

    return { success: false, message: 'No email client could be initialized.' };
  }
}
