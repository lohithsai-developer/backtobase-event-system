import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import { Participant } from '../models/Participant';
import { EventRegistration } from '../models/EventRegistration';
import { Event } from '../models/Event';
import { TicketService } from '../services/ticketService';
import { validateParticipantInput, validateEmail } from '../validators/schemas';
import { logger } from '../utils/logger';

export const addParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const { isValid, errors } = validateParticipantInput({ name, email });
    if (!isValid) {
      res.status(400).json({ success: false, errors, message: 'Invalid participant details.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find or create participant
    let participant = await Participant.findOne({ email: normalizedEmail });
    if (!participant) {
      participant = await Participant.create({
        name: name.trim(),
        email: normalizedEmail,
      });
    }

    // Check if already registered for THIS event
    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      participantId: participant._id,
    });

    if (existingRegistration) {
      res.status(409).json({
        success: false,
        message: 'This participant is already registered for this event.',
      });
      return;
    }

    // Generate secure QR ticket credentials
    const ticketDetails = await TicketService.createTicketDetails(event._id.toString());

    const registration = await EventRegistration.create({
      eventId: event._id,
      participantId: participant._id,
      registrationId: ticketDetails.registrationId,
      ticketToken: ticketDetails.token,
      ticketTokenHash: ticketDetails.tokenHash,
      ticketVersion: 1,
      emailStatus: 'pending',
      attendanceStatus: 'not_checked_in',
    });

    res.status(201).json({
      success: true,
      message: 'Participant registered successfully.',
      registration: {
        id: registration._id,
        registrationId: registration.registrationId,
        name: participant.name,
        email: participant.email,
        emailStatus: registration.emailStatus,
        attendanceStatus: registration.attendanceStatus,
        ticketUrl: ticketDetails.ticketUrl,
        qrCodeDataUrl: ticketDetails.qrCodeDataUrl,
        createdAt: registration.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Error adding participant:', error);
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Duplicate registration detected.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Could not register participant.' });
  }
};

/**
 * Preview file contents before actual bulk import
 */
export const previewImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      res.status(400).json({ success: false, message: 'The uploaded file is empty.' });
      return;
    }

    // Determine column keys (case-insensitive for Name and Email)
    const previewList: { name: string; email: string; isValid: boolean; isDuplicate?: boolean; error?: string }[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateInFileCount = 0;
    const seenEmails = new Set<string>();

    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const row = rows[i];
      const nameKey = Object.keys(row).find((k) => k.trim().toLowerCase() === 'name');
      const emailKey = Object.keys(row).find((k) => k.trim().toLowerCase() === 'email');

      const name = nameKey ? String(row[nameKey]).trim() : '';
      const email = emailKey ? String(row[emailKey]).trim().toLowerCase() : '';

      if (!name || !email) {
        previewList.push({ name, email, isValid: false, error: 'Missing Name or Email column value' });
        invalidCount++;
      } else if (!validateEmail(email)) {
        previewList.push({ name, email, isValid: false, error: 'Invalid email syntax' });
        invalidCount++;
      } else if (seenEmails.has(email)) {
        previewList.push({ name, email, isValid: false, isDuplicate: true, error: 'Duplicate email in uploaded file' });
        duplicateInFileCount++;
        invalidCount++;
      } else {
        seenEmails.add(email);
        previewList.push({ name, email, isValid: true });
        validCount++;
      }
    }

    res.json({
      success: true,
      totalRows: rows.length,
      samplePreview: previewList,
      validCount,
      invalidCount,
      duplicateInFileCount,
    });
  } catch (error) {
    logger.error('Error previewing import file:', error);
    res.status(500).json({ success: false, message: 'Failed to read or parse file.' });
  }
};

/**
 * Bulk import participants from CSV or Excel file
 */
export const importParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const file = (req as any).file;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      res.status(400).json({ success: false, message: 'The uploaded file is empty.' });
      return;
    }

    // Fetch existing registrations for this event to check duplicates in memory
    const existingRegs = await EventRegistration.find({ eventId: event._id }).populate<{
      participantId: { email: string };
    }>('participantId', 'email');

    const registeredEmailSet = new Set<string>();
    existingRegs.forEach((r) => {
      if (r.participantId && r.participantId.email) {
        registeredEmailSet.add(r.participantId.email.toLowerCase());
      }
    });

    const seenInThisFile = new Set<string>();
    let importedCount = 0;
    let skippedDuplicatesCount = 0;
    let failedCount = 0;
    const rejectedRows: { rowNumber: number; name: string; email: string; reason: string }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2; // considering 1-based header row

      const nameKey = Object.keys(row).find((k) => k.trim().toLowerCase() === 'name');
      const emailKey = Object.keys(row).find((k) => k.trim().toLowerCase() === 'email');

      const rawName = nameKey ? String(row[nameKey]).trim() : '';
      const rawEmail = emailKey ? String(row[emailKey]).trim().toLowerCase() : '';

      if (!rawName || !rawEmail) {
        failedCount++;
        rejectedRows.push({
          rowNumber,
          name: rawName,
          email: rawEmail,
          reason: 'Missing Name or Email field',
        });
        continue;
      }

      if (!validateEmail(rawEmail)) {
        failedCount++;
        rejectedRows.push({
          rowNumber,
          name: rawName,
          email: rawEmail,
          reason: 'Invalid email format',
        });
        continue;
      }

      if (seenInThisFile.has(rawEmail) || registeredEmailSet.has(rawEmail)) {
        skippedDuplicatesCount++;
        rejectedRows.push({
          rowNumber,
          name: rawName,
          email: rawEmail,
          reason: 'Duplicate participant email for this event',
        });
        continue;
      }

      seenInThisFile.add(rawEmail);
      registeredEmailSet.add(rawEmail);

      // Create or locate participant
      let participant = await Participant.findOne({ email: rawEmail });
      if (!participant) {
        participant = await Participant.create({
          name: rawName,
          email: rawEmail,
        });
      }

      const ticketDetails = await TicketService.createTicketDetails(event._id.toString());
      await EventRegistration.create({
        eventId: event._id,
        participantId: participant._id,
        registrationId: ticketDetails.registrationId,
        ticketToken: ticketDetails.token,
        ticketTokenHash: ticketDetails.tokenHash,
        ticketVersion: 1,
        emailStatus: 'pending',
        attendanceStatus: 'not_checked_in',
      });

      importedCount++;
    }

    res.json({
      success: true,
      message: `Import completed. ${importedCount} imported, ${skippedDuplicatesCount} skipped, ${failedCount} rejected.`,
      summary: {
        totalRows: rows.length,
        importedCount,
        skippedDuplicatesCount,
        failedCount,
        rejectedRows,
      },
    });
  } catch (error) {
    logger.error('Error during participant import:', error);
    res.status(500).json({ success: false, message: 'Import operation failed.' });
  }
};

export const getEventParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limitQuery = req.query.limit as string;
    const isScrollableAll = limitQuery === 'all' || parseInt(limitQuery) >= 5000;
    const limit = isScrollableAll ? 5000 : (parseInt(limitQuery) || 20);
    const search = (req.query.search as string) || '';
    const statusFilter = (req.query.status as string) || ''; // 'checked_in', 'not_checked_in', 'duplicates'
    const sortBy = (req.query.sortBy as string) || 'original'; // 'original', 'name_asc', 'name_desc', 'email_asc', 'email_desc', 'status', 'newest'

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid Event ID.' });
      return;
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    // 1. Calculate duplicates across ALL registrations for this event
    const allEventRegs = await EventRegistration.find({ eventId: eventObjectId })
      .populate<{ participantId: { name: string; email: string } }>('participantId', 'name email')
      .lean();

    const emailCounts = new Map<string, number>();
    const nameCounts = new Map<string, number>();
    const duplicateEmailList: string[] = [];
    const duplicateNameList: string[] = [];

    allEventRegs.forEach((reg: any) => {
      if (reg.participantId) {
        const em = (reg.participantId.email || '').trim().toLowerCase();
        const nm = (reg.participantId.name || '').trim().toLowerCase();
        if (em) {
          const c = (emailCounts.get(em) || 0) + 1;
          emailCounts.set(em, c);
        }
        if (nm) {
          const c = (nameCounts.get(nm) || 0) + 1;
          nameCounts.set(nm, c);
        }
      }
    });

    emailCounts.forEach((count, email) => {
      if (count > 1) duplicateEmailList.push(email);
    });
    nameCounts.forEach((count, name) => {
      if (count > 1) duplicateNameList.push(name);
    });

    // 2. Query Pipeline
    const matchQuery: any = { eventId: eventObjectId };
    if (statusFilter === 'checked_in' || statusFilter === 'not_checked_in') {
      matchQuery.attendanceStatus = statusFilter;
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

    // Filter duplicates only if selected
    if (statusFilter === 'duplicates') {
      const lowerNameRegexes = duplicateNameList.map((n) => new RegExp(`^${n}$`, 'i'));
      pipeline.push({
        $match: {
          $or: [
            { 'participant.email': { $in: duplicateEmailList } },
            ...(lowerNameRegexes.length > 0 ? [{ 'participant.name': { $in: lowerNameRegexes } }] : []),
          ],
        },
      });
    }

    // Count total matching
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await EventRegistration.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Sorting: default is strictly ORIGINAL ORDER ({ createdAt: 1, _id: 1 })
    if (sortBy === 'name_asc') {
      pipeline.push({ $sort: { 'participant.name': 1 } });
    } else if (sortBy === 'name_desc') {
      pipeline.push({ $sort: { 'participant.name': -1 } });
    } else if (sortBy === 'email_asc') {
      pipeline.push({ $sort: { 'participant.email': 1 } });
    } else if (sortBy === 'email_desc') {
      pipeline.push({ $sort: { 'participant.email': -1 } });
    } else if (sortBy === 'status') {
      pipeline.push({ $sort: { attendanceStatus: -1, createdAt: 1 } });
    } else if (sortBy === 'newest') {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else {
      // Default: 'original' -> original registration order
      pipeline.push({ $sort: { createdAt: 1, _id: 1 } });
    }

    if (!isScrollableAll) {
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });
    }

    const registrations = await EventRegistration.aggregate(pipeline);

    const formattedParticipants = registrations.map((r, idx) => {
      const pEmail = (r.participant?.email || '').trim().toLowerCase();
      const pName = (r.participant?.name || '').trim().toLowerCase();
      const emailCount = emailCounts.get(pEmail) || 1;
      const nameCount = nameCounts.get(pName) || 1;
      const isDupEmail = emailCount > 1;
      const isDupName = nameCount > 1;
      const isDuplicate = isDupEmail || isDupName;

      const dupReasons: string[] = [];
      if (isDupEmail) dupReasons.push(`Duplicate Email (${emailCount} times)`);
      if (isDupName) dupReasons.push(`Duplicate Name (${nameCount} times)`);

      return {
        id: r._id,
        registrationId: r.registrationId,
        originalIndex: (page - 1) * (isScrollableAll ? 0 : limit) + idx + 1,
        name: r.participant?.name || 'Unknown',
        email: r.participant?.email || '',
        ticketEmailStatus: r.emailStatus,
        attendanceStatus: r.attendanceStatus === 'checked_in' ? 'Yes' : 'No',
        rawAttendanceStatus: r.attendanceStatus,
        checkedInAt: r.checkedInAt,
        ticketVersion: r.ticketVersion,
        createdAt: r.createdAt,
        isDuplicate,
        isDuplicateEmail: isDupEmail,
        isDuplicateName: isDupName,
        duplicateReasons: dupReasons,
      };
    });

    res.json({
      success: true,
      participants: formattedParticipants,
      duplicatesSummary: {
        totalDuplicates: duplicateEmailList.length + duplicateNameList.length,
        duplicateEmailsCount: duplicateEmailList.length,
        duplicateNamesCount: duplicateNameList.length,
        duplicateEmails: duplicateEmailList,
        duplicateNames: duplicateNameList,
      },
      pagination: {
        page: isScrollableAll ? 1 : page,
        limit,
        total,
        totalPages: isScrollableAll ? 1 : (Math.ceil(total / limit) || 1),
        isScrollableAll,
      },
    });
  } catch (error) {
    logger.error('Error fetching event participants:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve participants.' });
  }
};

export const deleteRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid Registration ID.' });
      return;
    }

    const reg = await EventRegistration.findByIdAndDelete(registrationId);
    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Participant registration removed successfully.',
    });
  } catch (error) {
    logger.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'Failed to delete registration.' });
  }
};
