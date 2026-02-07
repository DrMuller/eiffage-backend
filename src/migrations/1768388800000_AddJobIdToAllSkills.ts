import { Db, ObjectId } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class AddJobIdToAllSkills1768388800000 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        // Step 1: Find the job with code "emp_0678"
        const job = await db.collection('job').findOne({ code: 'emp_0678' });
        if (!job) throw new Error('Job with code "emp_0678" not found. Cannot proceed with migration.');
        

        await db.collection('skill').updateMany({}, { $set: { jobId: job._id } });
        await db.collection('macro_skill').updateMany({}, { $set: { jobId: job._id } });
    }

    public async down(db: Db): Promise<void | never> {
        await db.collection('skill').updateMany({}, { $unset: { jobId: "" } });
        await db.collection('macro_skill').updateMany({}, { $unset: { jobId: "" } });
    }
}
