import { model, Model, Schema, Types } from 'mongoose';
import { Entity } from './Entity';
import { University } from './Person';

export interface Course extends Entity {
  id: string;
  display: string;
  university: University;
  createdBy: Types.ObjectId;
  studentIds: Types.ObjectId[];
  taIds: Types.ObjectId[];
}

const CourseSchema: Schema<Course> = new Schema<Course>(
  {
    id:         { type: String, required: true },
    display:    { type: String, required: true },
    university: { type: String, enum: ['uvu', 'uofu'], required: true },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'persons', required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'persons' }],
    taIds:      [{ type: Schema.Types.ObjectId, ref: 'persons' }],
  },
  { id: false, timestamps: true }
);

export const CourseModel: Model<Course> = model<Course>('courses', CourseSchema);
