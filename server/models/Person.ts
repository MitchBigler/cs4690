import { model, Model, Schema } from 'mongoose';
import { Entity } from './Entity';

export type Role = 'admin' | 'teacher' | 'ta' | 'student';
export type University = 'uvu' | 'uofu';

export interface Person extends Entity {
  username: string;
  password: string;       // bcrypt hashed
  role: Role;
  university: University;
  displayName?: string;
  uvuId?: string;         // for students; links to Log.uvuId
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

// Enforce username uniqueness per university (same username allowed across universities)
PersonSchema.index({ username: 1, university: 1 }, { unique: true });

export const PersonModel: Model<Person> = model<Person>('persons', PersonSchema);
