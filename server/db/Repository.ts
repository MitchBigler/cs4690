import { Entity } from "../models/Entity";
import { Model} from 'mongoose';
import 'reflect-metadata';

class Repository<T extends Entity> {
    protected entityModel: Model<T> 

    public constructor(entityModel : Model<T>)
    {
        this.entityModel = entityModel;
    }

    public async save(t: T): Promise<T>
    {
        try {
            const modelT = new this.entityModel(t);
            const saved = await modelT.save();
            if (saved)
            {
                t = modelT;
            }
            console.log(`Saved ${JSON.stringify(t)} to collection`);
            return t;
            
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    async get(filters?: Map<string, string>): Promise<T[] | null>
    {
        let results : T[] | null = null;
        const query = this.entityModel.find<T>(); // default return everything

        // use filters else return all
        if (filters && filters.size > 0) {
            // if filters then add them to the query
            // Filter results based on any provided filters
            for (const [key, value] of filters.entries()) {
                query.where(key).equals(value);
            }
        }
        results = await query.exec();

        return results;
    }

    public async update(filters: Partial<T>, updates: Partial<T>): Promise<T | null> {
    try {
        const updated = await this.entityModel.findOneAndUpdate(
            filters,
            { $set: updates },
            { new: true }
        );
        console.log(`Updated: ${JSON.stringify(updated)}`);
        return updated as T | null;
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
}
}

export { Repository };