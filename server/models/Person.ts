import { model, Model, Schema } from 'mongoose';
import { Entity } from './Entity';

export type Role = 'admin' | 'teacher' | 'ta' | 'student';
export type University = 'uvu' | 'uofu';

export interface Person extends Entity {
  username: string;
  password: string;
  role: Role;
  university: University;
  displayName?: string;
  uvuId?: string;
}

const PersonSchema: Schema<Person> = new Schema<Person>(
  {
    username:    { type: String, required: true },
    password:    { type: String, required: true },
    role:        { type: String, enum: ['admin', 'teacher', 'ta', 'student'], required: true },
    university:  { type: String, enum: ['uvu', 'uofu'], required: true },
    displayName: { type: String },
    uvuId:       { type: String },
  },
  { timestamps: true }
);

// no dupe usernames
PersonSchema.index({ username: 1, university: 1 }, { unique: true });

export const PersonModel: Model<Person> = model<Person>('persons', PersonSchema);
