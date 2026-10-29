import mongoose, { Schema, Document, Types } from 'mongoose';

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'delivered';
export type AttendanceStatus = 'checked_in' | 'not_checked_in';

export interface IEventRegistration extends Document {
  eventId: Types.ObjectId;
  participantId: Types.ObjectId;
  registrationId: string;
  ticketToken?: string | null;
  ticketTokenHash: string;
  ticketVersion: number;
  emailStatus: EmailStatus;
  emailError?: string;
  attendanceStatus: AttendanceStatus;
  checkedInAt: Date | null;
  checkedInBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema: Schema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
      index: true,
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ticketToken: {
      type: String,
      default: null,
    },
    ticketTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ticketVersion: {
      type: Number,
      default: 1,
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'delivered'],
      default: 'pending',
      index: true,
    },
    emailError: {
      type: String,
      default: null,
    },
    attendanceStatus: {
      type: String,
      enum: ['checked_in', 'not_checked_in'],
      default: 'not_checked_in',
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee unique participant registration per event
EventRegistrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });
EventRegistrationSchema.index({ eventId: 1, attendanceStatus: 1 });

export const EventRegistration = mongoose.model<IEventRegistration>(
  'EventRegistration',
  EventRegistrationSchema
);
