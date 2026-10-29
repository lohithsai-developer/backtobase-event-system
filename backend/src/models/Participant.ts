import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant extends Document {
  name: string;
  email: string;
  createdAt: Date;
}

const ParticipantSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Participant email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Participant = mongoose.model<IParticipant>('Participant', ParticipantSchema);
