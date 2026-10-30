import { Request, Response } from 'express';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { EventRegistration } from '../models/EventRegistration';
import { Event, IEvent } from '../models/Event';
import { Participant, IParticipant } from '../models/Participant';
import { TicketService } from '../services/ticketService';
import { EmailService } from '../services/emailService';
import { hashToken, generateSecureToken } from '../utils/hash';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

export const getTicketByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ success: false, message: 'Ticket token is required.' });
      return;
    }

    const tokenHash = hashToken(token.trim());
    const registration = await EventRegistration.findOne({ ticketTokenHash: tokenHash })
      .populate<{ eventId: IEvent }>('eventId')
      .populate<{ participantId: IParticipant }>('participantId');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found, invalid, or has been revoked/reissued.',
      });
      return;
    }

    const event = registration.eventId;
    const participant = registration.participantId;

    // Generate fresh QR code data URL for rendering in the public ticket view
    const qrCodeDataUrl = await QRCode.toDataURL(token.trim(), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 350,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    res.json({
      success: true,
      ticket: {
        registrationId: registration.registrationId,
        eventName: event.name,
        eventDescription: event.description,
        eventDate: event.date,
        participantName: participant.name,
        attendanceStatus: registration.attendanceStatus === 'checked_in' ? 'Checked In' : 'Active Pass',
        isCheckedIn: registration.attendanceStatus === 'checked_in',
        checkedInAt: registration.checkedInAt,
        qrCodeDataUrl,
      },
    });
  } catch (error) {
    logger.error('Error fetching ticket by token:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve ticket.' });
  }
};

export const sendTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid Registration ID.' });
      return;
    }

    const registration = await EventRegistration.findById(registrationId)
      .populate<{ eventId: IEvent }>('eventId')
      .populate<{ participantId: IParticipant }>('participantId');

    if (!registration) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const event = registration.eventId;
    const participant = registration.participantId;

    // Create a fresh token representation or reissue if necessary
    const reissued = await TicketService.reissueTicket(registration._id.toString());

    const result = await EmailService.sendTicketEmail(registration._id.toString(), {
      toEmail: participant.email,
      participantName: participant.name,
      eventName: event.name,
      eventDescription: event.description,
      eventDate: new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      ticketUrl: reissued.ticketUrl,
      qrCodeDataUrl: reissued.qrCodeDataUrl,
      registrationId: registration.registrationId,
    });

    if (!result.success) {
      res.status(502).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.json({
      success: true,
      message: `Ticket successfully sent to ${participant.email}.`,
    });
  } catch (error) {
    logger.error('Error sending ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to send ticket email.' });
  }
};

export const sendBulkTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { target } = req.body; // 'all' or 'pending' (default 'all')

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const query: any = { eventId: event._id };
    if (target === 'pending') {
      query.emailStatus = { $in: ['pending', 'failed'] };
    }

    const registrations = await EventRegistration.find(query)
      .populate<{ participantId: IParticipant }>('participantId');

    if (registrations.length === 0) {
      res.json({
        success: true,
        message: 'No eligible registrations found to send tickets to.',
        totalProcessed: 0,
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 5 with short pacing
    const batchSize = 5;
    for (let i = 0; i < registrations.length; i += batchSize) {
      const batch = registrations.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (reg) => {
          try {
            const participant = reg.participantId as unknown as IParticipant;
            if (!participant || !participant.email) return;

            const reissued = await TicketService.reissueTicket(reg._id.toString());
            const emailResult = await EmailService.sendTicketEmail(reg._id.toString(), {
              toEmail: participant.email,
              participantName: participant.name,
              eventName: event.name,
              eventDescription: event.description,
              eventDate: new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              ticketUrl: reissued.ticketUrl,
              qrCodeDataUrl: reissued.qrCodeDataUrl,
              registrationId: reg.registrationId,
            });

            if (emailResult.success) {
              successCount++;
            } else {
              failureCount++;
            }
          } catch (err) {
            failureCount++;
            logger.error(`Error sending bulk ticket for reg ${reg._id}:`, err);
          }
        })
      );
    }

    res.json({
      success: true,
      message: `Bulk dispatch completed. ${successCount} sent, ${failureCount} failed.`,
      summary: {
        totalTargeted: registrations.length,
        successCount,
        failureCount,
      },
    });
  } catch (error) {
    logger.error('Error during bulk ticket dispatch:', error);
    res.status(500).json({ success: false, message: 'Failed to complete bulk ticket dispatch.' });
  }
};

export const reissueTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid Registration ID.' });
      return;
    }

    const reissued = await TicketService.reissueTicket(registrationId);

    res.json({
      success: true,
      message: 'Ticket successfully reissued. Old QR ticket has been revoked.',
      ticket: reissued,
    });
  } catch (error) {
    logger.error('Error reissuing ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to reissue ticket.' });
  }
};

/**
 * Get full QR code pass details for admin preview
 */
export const getRegistrationQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid Registration ID.' });
      return;
    }

    const reg = await EventRegistration.findById(registrationId)
      .populate<{ eventId: IEvent }>('eventId')
      .populate<{ participantId: IParticipant }>('participantId');

    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    let token = reg.ticketToken;
    if (!token) {
      token = generateSecureToken(32);
      reg.ticketToken = token;
      reg.ticketTokenHash = hashToken(token);
      await reg.save();
    }

    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const ticketUrl = `${ENV.PUBLIC_APP_URL}/ticket/${token}`;

    res.json({
      success: true,
      qr: {
        registrationId: reg.registrationId,
        participantName: reg.participantId ? (reg.participantId as any).name : 'Attendee',
        participantEmail: reg.participantId ? (reg.participantId as any).email : '',
        eventName: reg.eventId ? (reg.eventId as any).name : 'Event',
        token,
        ticketUrl,
        qrCodeDataUrl,
        attendanceStatus: reg.attendanceStatus === 'checked_in' ? 'Checked In' : 'Active Pass',
        isCheckedIn: reg.attendanceStatus === 'checked_in',
      },
    });
  } catch (error) {
    logger.error('Error fetching registration QR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve ticket QR.' });
  }
};

/**
 * Get all ticket links for an event
 */
export const getAllTicketLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const registrations = await EventRegistration.find({ eventId })
      .populate<{ participantId: any }>('participantId')
      .populate<{ eventId: any }>('eventId')
      .sort({ 'participantId.name': 1 });

    const getBaseUrl = () => {
      if (process.env.PUBLIC_PASS_URL && !process.env.PUBLIC_PASS_URL.includes('localhost')) {
        return process.env.PUBLIC_PASS_URL.replace(/\/$/, '');
      }
      const origin = req.get('origin') || req.get('referer');
      if (origin && !origin.includes('localhost')) {
        return origin.replace(/\/$/, '');
      }
      if (ENV.PUBLIC_APP_URL && !ENV.PUBLIC_APP_URL.includes('localhost')) {
        return ENV.PUBLIC_APP_URL;
      }
      return 'https://backtobaseevents.vercel.app';
    };
    const baseUrl = getBaseUrl();

    const links = await Promise.all(
      registrations.map(async (r: any) => {
        let token = r.ticketToken;
        if (!token) {
          token = generateSecureToken(32);
          r.ticketToken = token;
          r.ticketTokenHash = hashToken(token);
          await r.save();
        }
        return {
          id: r._id,
          registrationId: r.registrationId,
          name: r.participantId ? r.participantId.name : 'Attendee',
          email: r.participantId ? r.participantId.email : '',
          token,
          ticketUrl: `${baseUrl}/pass/${token}`,
          attendanceStatus: r.attendanceStatus === 'checked_in' ? 'Checked In' : 'Not Checked In',
          isCheckedIn: r.attendanceStatus === 'checked_in',
        };
      })
    );

    res.json({
      success: true,
      total: links.length,
      links,
    });
  } catch (error) {
    logger.error('Error fetching ticket links:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve ticket links.' });
  }
};

/**
 * Export all pass links as a CSV file ready for download
 */
export const exportTicketLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const registrations = await EventRegistration.find({ eventId })
      .populate<{ participantId: any }>('participantId')
      .populate<{ eventId: any }>('eventId');

    const getBaseUrl = () => {
      if (process.env.PUBLIC_PASS_URL && !process.env.PUBLIC_PASS_URL.includes('localhost')) {
        return process.env.PUBLIC_PASS_URL.replace(/\/$/, '');
      }
      const origin = req.get('origin') || req.get('referer');
      if (origin && !origin.includes('localhost')) {
        return origin.replace(/\/$/, '');
      }
      if (ENV.PUBLIC_APP_URL && !ENV.PUBLIC_APP_URL.includes('localhost')) {
        return ENV.PUBLIC_APP_URL;
      }
      return 'https://backtobaseevents.vercel.app';
    };
    const baseUrl = getBaseUrl();

    const rows = await Promise.all(
      registrations.map(async (r: any) => {
        let token = r.ticketToken;
        if (!token) {
          token = generateSecureToken(32);
          r.ticketToken = token;
          r.ticketTokenHash = hashToken(token);
          await r.save();
        }
        return {
          'Attendee Name': r.participantId ? r.participantId.name : 'Attendee',
          'Email Address': r.participantId ? r.participantId.email : '',
          'Pass ID': r.registrationId,
          'Unique Ticket Pass Link': `${baseUrl}/pass/${token}`,
          'Attendance Status': r.attendanceStatus === 'checked_in' ? 'Checked In' : 'Not Checked In',
        };
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pass Links');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=BacktoBase_Pass_Links_${Date.now()}.csv`);
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting ticket links:', error);
    res.status(500).json({ success: false, message: 'Failed to export ticket links.' });
  }
};
