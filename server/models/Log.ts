import { model, Model, Schema } from 'mongoose';
import { Entity } from "./Entity";

// {"courseId":"cs4660","uvuId":"10111111","date":"1/23/2021 1:23:36 PM","text":"Initial comment. Hello World"
interface Log extends Entity {
    courseId: string;
    uvuId: string;
    text: string;
    date: string;
}

const LogSchema : Schema<Log> = new Schema<Log>( {
      courseId: String,
      uvuId: String,
      text: String,
      date: String,
    });

const LogModel : Model<Log> = model<Log>("logs", LogSchema);

export { Log, LogSchema, LogModel };