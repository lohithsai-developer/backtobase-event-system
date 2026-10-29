import { Request, Response } from 'express';
import { Event } from '../models/Event';
import { EventRegistration } from '../models/EventRegistration';
import { logger } from '../utils/logger';

export const getPublicActiveEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeEvent = await Event.findOne({ status: 'active' });

    if (!activeEvent) {
      res.json({
        success: true,
        activeEvent: null,
        message: 'No active event at the moment.',
      });
      return;
    }

    // Compute stats
    const totalParticipants = await EventRegistration.countDocuments({ eventId: activeEvent._id });
    const totalAttended = await EventRegistration.countDocuments({
      eventId: activeEvent._id,
      attendanceStatus: 'checked_in',
    });
    const remainingParticipants = Math.max(0, totalParticipants - totalAttended);
    const attendancePercentage =
      totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100 * 10) / 10 : 0;

    // Fetch participant list for active event
    const registrations = await EventRegistration.find({ eventId: activeEvent._id })
      .populate<{ participantId: any }>('participantId')
      .sort({ checkedInAt: -1, createdAt: -1 })
      .limit(100);

    const participants = registrations.map((r: any) => ({
      id: r._id,
      name: r.participantId?.name || 'Attendee',
      email: r.participantId?.email || '',
      attendanceStatus: r.attendanceStatus === 'checked_in' ? 'Checked In' : 'Registered',
      isCheckedIn: r.attendanceStatus === 'checked_in',
      checkedInAt: r.checkedInAt,
    }));

    res.json({
      success: true,
      activeEvent: {
        id: activeEvent._id,
        name: activeEvent.name,
        description: activeEvent.description,
        date: activeEvent.date,
        totalParticipants,
        totalAttended,
        remainingParticipants,
        attendancePercentage,
        participants,
      },
    });
  } catch (error) {
    logger.error('Error fetching public active event:', error);
    res.status(500).json({ success: false, message: 'Could not load active event details.' });
  }
};
