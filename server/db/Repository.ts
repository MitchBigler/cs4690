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
            const isSaved = await modelT.save();
            if (isSaved)
            {
                t = modelT;
            }
            
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
        // check out what the inserted at, created at, (and _id are if it's an insert) or (only the first two if update)
        console.log(`Saved ${JSON.stringify(t)} to collection`);
        return t;
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
}

export { Repository };