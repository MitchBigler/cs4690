import { model, Model, Schema } from 'mongoose';
import { Entity } from './Entity';
import { University } from './Person';

export interface Log extends Entity {
  courseId: string;
  uvuId: string;
  text: string;
  date: string;
  university: University;
}

const LogSchema: Schema<Log> = new Schema<Log>(
  {
    courseId:   { type: String, required: true },
    uvuId:      { type: String, required: true },
    text:       { type: String, required: true },
    date:       { type: String, required: true },
    university: { type: String, enum: ['uvu', 'uofu'], required: true },
  },
  { timestamps: true }
);

export const LogModel: Model<Log> = model<Log>('logs', LogSchema);
