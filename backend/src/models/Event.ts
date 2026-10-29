import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  description: string;
  date: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [150, 'Event name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ date: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
