import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'volunteer';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'volunteer'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
