import { Schema } from 'mongoose';

interface Entity {
    createdAt: Date; // Optional: if timestamps are enabled
    updatedAt: Date; // Optional: if timestamps are enabled   
}


const EntitySchema : Schema<Entity> = new Schema<Entity>( {
      createdAt: { type: Date, required: true },
      updatedAt: { type: Date, required: true },
    },
    {
      timestamps: true, // Mongoose handles createdAt and updatedAt
    });

// don't need model for entities since classes like logs and courses extend it
// const EntityModel : Model<Entity> = model("logs", EntitySchema)


export { Entity, EntitySchema };