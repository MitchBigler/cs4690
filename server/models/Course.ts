import { Entity } from "./Entity";
import { model, Model, Schema } from 'mongoose';

// {"id":"cs4690","display":"CS 4690"}
interface Course extends Entity {
  id: string;
  display: string;
}

const CourseSchema : Schema<Course> = new Schema<Course>( {
    id: String,
    display: String
  }, { id: false });

const CourseModel : Model<Course> = model<Course>("courses", CourseSchema);

export { Course, CourseSchema, CourseModel };