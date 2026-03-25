import { Entity } from "./Entity";
import { model, Model, Schema } from 'mongoose';

// {"id":"cs4690","display":"CS 4690"}
interface Course extends Entity {
    display: string;
}

const CourseSchema : Schema<Course> = new Schema<Course>( {
    display: String
  });

const CourseModel : Model<Course> = model<Course>("courses", CourseSchema);

export { Course, CourseSchema, CourseModel };