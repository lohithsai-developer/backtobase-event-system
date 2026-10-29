import QRCode from 'qrcode';
import { generateSecureToken, hashToken } from '../utils/hash';
import { EventRegistration, IEventRegistration } from '../models/EventRegistration';
import { Event, IEvent } from '../models/Event';
import { Participant, IParticipant } from '../models/Participant';
import { ENV } from '../config/env';

export interface GeneratedTicket {
  token: string;
  tokenHash: string;
  registrationId: string;
  qrCodeDataUrl: string;
  ticketUrl: string;
}

export class TicketService {
  /**
   * Generates a new ticket payload for a registration
   */
  public static async createTicketDetails(eventIdStr: string): Promise<GeneratedTicket> {
    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const eventSnippet = eventIdStr.slice(-4).toUpperCase();
    const registrationId = `BTB-${eventSnippet}-${suffix}`;

    // The QR code contains the secure raw token or direct validation URL
    const ticketUrl = `${ENV.PUBLIC_APP_URL}/ticket/${token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 400,
    });

    return {
      token,
      tokenHash,
      registrationId,
      qrCodeDataUrl,
      ticketUrl,
    };
  }

  /**
   * Reissues a ticket, revoking the old token
   */
  public static async reissueTicket(registrationId: string): Promise<{ token: string; qrCodeDataUrl: string; ticketUrl: string }> {
    const reg = await EventRegistration.findById(registrationId);
    if (!reg) {
      throw new Error('Registration not found');
    }

    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const ticketUrl = `${ENV.PUBLIC_APP_URL}/ticket/${token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 400,
    });

    reg.ticketToken = token;
    reg.ticketTokenHash = tokenHash;
    reg.ticketVersion = (reg.ticketVersion || 1) + 1;
    reg.emailStatus = 'pending';
    await reg.save();

    return {
      token,
      qrCodeDataUrl,
      ticketUrl,
    };
  }

  /**
   * Look up registration and participant by raw token
   */
  public static async findByToken(rawToken: string): Promise<{
    registration: any;
    participant: IParticipant;
    event: IEvent;
  } | null> {
    if (!rawToken || typeof rawToken !== 'string') return null;

    const tokenHash = hashToken(rawToken.trim());
    const registration = await EventRegistration.findOne({ ticketTokenHash: tokenHash })
      .populate<{ eventId: IEvent }>('eventId')
      .populate<{ participantId: IParticipant }>('participantId');

    if (!registration) return null;

    return {
      registration,
      participant: registration.participantId as unknown as IParticipant,
      event: registration.eventId as unknown as IEvent,
    };
  }
}
