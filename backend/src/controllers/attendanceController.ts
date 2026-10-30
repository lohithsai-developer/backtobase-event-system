import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import { Event } from '../models/Event';
import { EventRegistration } from '../models/EventRegistration';
import { Participant, IParticipant } from '../models/Participant';
import { hashToken } from '../utils/hash';
import { logger } from '../utils/logger';

/**
 * Scan and validate QR Ticket token
 */
export const scanTicket = async (req: any, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      res.status(400).json({
        success: false,
        status: 'INVALID',
        message: 'Invalid or missing QR ticket code.',
      });
      return;
    }

    // Step 1: Find currently active event
    const activeEvent = await Event.findOne({ status: 'active' });
    if (!activeEvent) {
      res.status(400).json({
        success: false,
        status: 'NO_ACTIVE_EVENT',
        message: 'No active event at the moment. Please ask the administrator to activate an event.',
      });
      return;
    }

    // Step 2: Hash token and look up registration
    const tokenHash = hashToken(token.trim());
    const registration = await EventRegistration.findOne({ ticketTokenHash: tokenHash })
      .populate<{ eventId: any }>('eventId')
      .populate<{ participantId: IParticipant }>('participantId');

    if (!registration) {
      res.status(404).json({
        success: false,
        status: 'INVALID_TICKET',
        message: 'Invalid or revoked ticket. This ticket could not be found.',
      });
      return;
    }

    const participant = registration.participantId as unknown as IParticipant;
    const ticketEvent = registration.eventId;

    // Step 3: Check if ticket belongs to the currently active event
    if (registration.eventId._id.toString() !== activeEvent._id.toString()) {
      res.status(400).json({
        success: false,
        status: 'WRONG_EVENT',
        message: 'This ticket belongs to a different event.',
        ticketEventName: ticketEvent.name,
        activeEventName: activeEvent.name,
        participantName: participant.name,
      });
      return;
    }

    // Step 4: Check if already checked in
    if (registration.attendanceStatus === 'checked_in') {
      res.status(200).json({
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: 'Already Checked In.',
        participantName: participant.name,
        participantEmail: participant.email,
        checkedInAt: registration.checkedInAt,
        checkedInBy: registration.checkedInBy || 'Volunteer',
        registrationId: registration._id,
      });
      return;
    }

    // Step 5: Atomic conditional update to prevent race conditions & duplicate scans
    const volunteerIdentifier = req.user?.username || 'volunteer';
    const now = new Date();

    const updatedRegistration = await EventRegistration.findOneAndUpdate(
      {
        _id: registration._id,
        attendanceStatus: 'not_checked_in', // Atomic condition
      },
      {
        $set: {
          attendanceStatus: 'checked_in',
          checkedInAt: now,
          checkedInBy: volunteerIdentifier,
        },
      },
      { new: true }
    );

    if (!updatedRegistration) {
      // Concurrently scanned by another volunteer at the exact same fraction of a second
      res.status(200).json({
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: 'Already Checked In.',
        participantName: participant.name,
        participantEmail: participant.email,
        checkedInAt: registration.checkedInAt || now,
        checkedInBy: registration.checkedInBy || volunteerIdentifier,
      });
      return;
    }

    logger.info(
      `Attendance marked for participant ${participant.name} (${participant.email}) by ${volunteerIdentifier} at ${now.toISOString()}`
    );

    res.status(200).json({
      success: true,
      status: 'SUCCESS',
      message: 'Attendance Marked Successfully.',
      participantName: participant.name,
      participantEmail: participant.email,
      checkedInStatus: 'Yes',
      checkedInAt: now,
      checkedInBy: volunteerIdentifier,
      eventName: activeEvent.name,
      registrationId: registration._id,
      ticketCode: registration.registrationId,
    });
  } catch (error) {
    logger.error('Error during ticket scanning:', error);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      message: 'A server error occurred while processing the ticket.',
    });
  }
};

/**
 * Main Event Attendance list: EXACTLY 3 visible fields (Name, Email, Checked In)
 */
export const getEventAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const search = (req.query.search as string) || '';
    const statusFilter = (req.query.status as string) || ''; // 'Yes', 'No'
    const page = parseInt(req.query.page as string) || 1;
    const limitQuery = req.query.limit as string;
    const isScrollableAll = limitQuery === 'all' || parseInt(limitQuery) >= 5000;
    const limit = isScrollableAll ? 5000 : (parseInt(limitQuery) || 50);
    const sortBy = (req.query.sortBy as string) || 'original';

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const matchQuery: any = { eventId: new mongoose.Types.ObjectId(eventId) };
    if (statusFilter === 'Yes') {
      matchQuery.attendanceStatus = 'checked_in';
    } else if (statusFilter === 'No') {
      matchQuery.attendanceStatus = 'not_checked_in';
    }

    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'participants',
          localField: 'participantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
    ];

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [{ 'participant.name': searchRegex }, { 'participant.email': searchRegex }],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await EventRegistration.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Sorting: default to original order ({ createdAt: 1, _id: 1 })
    if (sortBy === 'name') {
      pipeline.push({ $sort: { 'participant.name': 1 } });
    } else if (sortBy === 'status') {
      pipeline.push({ $sort: { attendanceStatus: -1, createdAt: 1 } });
    } else {
      pipeline.push({ $sort: { createdAt: 1, _id: 1 } });
    }

    if (!isScrollableAll) {
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });
    }

    const records = await EventRegistration.aggregate(pipeline);

    const getBaseUrl = () => {
      const origin = req.get('origin') || req.get('referer');
      if (origin && !origin.includes('localhost')) {
        return origin.replace(/\/$/, '');
      }
      if (process.env.PUBLIC_APP_URL && !process.env.PUBLIC_APP_URL.includes('localhost')) {
        return process.env.PUBLIC_APP_URL;
      }
      return 'https://backtobaseevents.vercel.app';
    };
    const baseUrl = getBaseUrl();

    // Output attendance table with id and helper fields for toggling
    const attendanceTable = records.map((r) => ({
      id: r._id,
      registrationId: r.registrationId,
      name: r.participant.name,
      email: r.participant.email,
      checkedIn: r.attendanceStatus === 'checked_in' ? 'Yes' : 'No',
      isCheckedIn: r.attendanceStatus === 'checked_in',
      checkedInAt: r.checkedInAt,
      ticketUrl: r.ticketToken ? `${baseUrl}/pass/${r.ticketToken}` : '',
    }));

    res.json({
      success: true,
      records: attendanceTable,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching event attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance records.' });
  }
};

/**
 * Export attendance: Exactly 3 columns (Name, Email, Checked In)
 */
export const exportAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const format = (req.query.format as string) || 'csv'; // 'csv' or 'xlsx'

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate<{ participantId: IParticipant }>('participantId')
      .sort({ createdAt: 1 });

    // Enforce strictly Name, Email, Checked In
    const exportRows = registrations.map((r) => {
      const p = r.participantId as unknown as IParticipant;
      return {
        Name: p ? p.name : 'Unknown',
        Email: p ? p.email : 'Unknown',
        'Checked In': r.attendanceStatus === 'checked_in' ? 'Yes' : 'No',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const sanitizedEventName = event.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'xlsx') {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="BacktoBase_Attendance_${sanitizedEventName}.xlsx"`
      );
      res.send(buffer);
    } else {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="BacktoBase_Attendance_${sanitizedEventName}.csv"`
      );
      res.send(csv);
    }
  } catch (error) {
    logger.error('Error exporting attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to export attendance.' });
  }
};

/**
 * Scan history / audit trail view (optional separate admin view)
 */
export const getScanHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const scans = await EventRegistration.find({
      eventId,
      attendanceStatus: 'checked_in',
    })
      .populate<{ participantId: IParticipant }>('participantId')
      .sort({ checkedInAt: -1 })
      .limit(100);

    const history = scans.map((s) => ({
      id: s._id,
      registrationId: s.registrationId,
      name: s.participantId ? (s.participantId as unknown as IParticipant).name : 'Unknown',
      email: s.participantId ? (s.participantId as unknown as IParticipant).email : 'Unknown',
      checkedInAt: s.checkedInAt,
      checkedInBy: s.checkedInBy,
    }));

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    logger.error('Error fetching scan history:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve scan history.' });
  }
};

/**
 * Toggle attendance for a participant registration (Admin & Volunteer gate access)
 */
export const toggleAttendance = async (req: any, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid Registration ID.' });
      return;
    }

    const registration = await EventRegistration.findById(registrationId)
      .populate<{ eventId: any }>('eventId')
      .populate<{ participantId: any }>('participantId');

    if (!registration) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const willCheckIn = registration.attendanceStatus !== 'checked_in';
    const now = new Date();
    const volunteerId = req.user?.username || 'Staff/Volunteer';

    registration.attendanceStatus = willCheckIn ? 'checked_in' : 'not_checked_in';
    registration.checkedInAt = willCheckIn ? now : null;
    registration.checkedInBy = willCheckIn ? volunteerId : '';
    await registration.save();

    // Recalculate event attendance stats
    const totalAttended = await EventRegistration.countDocuments({
      eventId: registration.eventId._id,
      attendanceStatus: 'checked_in',
    });
    await Event.findByIdAndUpdate(registration.eventId._id, { totalAttended });

    const participantName = (registration.participantId as any)?.name || 'Attendee';

    logger.info(
      `Attendance toggled to ${registration.attendanceStatus} for ${participantName} by ${volunteerId}`
    );

    res.json({
      success: true,
      message: willCheckIn
        ? `Attendance marked as Checked In for ${participantName}`
        : `Attendance marked as Not Checked In for ${participantName}`,
      registrationId: registration._id,
      newStatus: registration.attendanceStatus,
      isCheckedIn: willCheckIn,
      checkedIn: willCheckIn ? 'Yes' : 'No',
      checkedInAt: registration.checkedInAt,
    });
  } catch (error) {
    logger.error('Error toggling attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance status.' });
  }
};
