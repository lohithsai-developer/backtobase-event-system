import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { EventRegistration } from '../models/EventRegistration';
import { validateEventInput } from '../validators/schemas';
import { logger } from '../utils/logger';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, date } = req.body;
    const { isValid, errors } = validateEventInput({ name, description, date });

    if (!isValid) {
      res.status(400).json({ success: false, errors, message: 'Validation failed.' });
      return;
    }

    const event = await Event.create({
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      status: 'inactive', // Default is inactive; explicit activation is required
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        status: event.status,
        totalParticipants: 0,
        totalAttended: 0,
        remainingParticipants: 0,
        attendancePercentage: 0,
      },
    });
  } catch (error: any) {
    logger.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Could not create event.' });
  }
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().sort({ date: -1, createdAt: -1 });

    // Aggregate registration stats per event atomically
    const eventStats = await EventRegistration.aggregate([
      {
        $group: {
          _id: '$eventId',
          totalParticipants: { $sum: 1 },
          totalAttended: {
            $sum: {
              $cond: [{ $eq: ['$attendanceStatus', 'checked_in'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const statsMap = new Map<string, { totalParticipants: number; totalAttended: number }>();
    eventStats.forEach((stat) => {
      statsMap.set(stat._id.toString(), {
        totalParticipants: stat.totalParticipants,
        totalAttended: stat.totalAttended,
      });
    });

    const enrichedEvents = events.map((event) => {
      const stats = statsMap.get(event._id.toString()) || { totalParticipants: 0, totalAttended: 0 };
      const totalParticipants = stats.totalParticipants;
      const totalAttended = stats.totalAttended;
      const remainingParticipants = Math.max(0, totalParticipants - totalAttended);
      const attendancePercentage =
        totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100 * 10) / 10 : 0;

      return {
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        status: event.status,
        createdAt: event.createdAt,
        totalParticipants,
        totalAttended,
        remainingParticipants,
        attendancePercentage,
      };
    });

    res.json({
      success: true,
      events: enrichedEvents,
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const totalParticipants = await EventRegistration.countDocuments({ eventId: event._id });
    const totalAttended = await EventRegistration.countDocuments({
      eventId: event._id,
      attendanceStatus: 'checked_in',
    });
    const remainingParticipants = Math.max(0, totalParticipants - totalAttended);
    const attendancePercentage =
      totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100 * 10) / 10 : 0;

    res.json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        status: event.status,
        createdAt: event.createdAt,
        totalParticipants,
        totalAttended,
        remainingParticipants,
        attendancePercentage,
      },
    });
  } catch (error) {
    logger.error('Error fetching event by id:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event.' });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { name, description, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
      return;
    }

    const { isValid, errors } = validateEventInput({ name, description, date });
    if (!isValid) {
      res.status(400).json({ success: false, errors, message: 'Validation failed.' });
      return;
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        name: name.trim(),
        description: description.trim(),
        date: new Date(date),
      },
      { new: true }
    );

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
};

/**
 * Concurrency-safe event activation / deactivation.
 * Ensures strictly only ONE event is active globally at any time.
 */
export const toggleEventStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { targetStatus } = req.body; // 'active' or 'inactive'

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
      return;
    }

    const target = await Event.findById(eventId);
    if (!target) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const nextStatus = targetStatus || (target.status === 'active' ? 'inactive' : 'active');

    if (nextStatus === 'active') {
      // Step 1: Deactivate all other events atomically
      await Event.updateMany({ _id: { $ne: target._id } }, { $set: { status: 'inactive' } });
      // Step 2: Set target event as active
      target.status = 'active';
      await target.save();
      logger.info(`Event ${target.name} (${target._id}) is now ACTIVE globally.`);
    } else {
      target.status = 'inactive';
      await target.save();
      logger.info(`Event ${target.name} (${target._id}) is now INACTIVE.`);
    }

    res.json({
      success: true,
      message: `Event status updated to ${target.status}.`,
      event: target,
    });
  } catch (error) {
    logger.error('Error toggling event status:', error);
    res.status(500).json({ success: false, message: 'Failed to update event status.' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
      return;
    }

    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Clean up associated registrations for this event
    await EventRegistration.deleteMany({ eventId: event._id });

    res.json({
      success: true,
      message: 'Event and associated registrations deleted successfully.',
    });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
};
