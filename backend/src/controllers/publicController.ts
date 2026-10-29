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
      },
    });
  } catch (error) {
    logger.error('Error fetching public active event:', error);
    res.status(500).json({ success: false, message: 'Could not load active event details.' });
  }
};
