import { Db, ObjectId } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class AddJobIdToAllSkills1768388800000 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        await db.collection('macro_skill_type').updateOne(
            { name: 'Macro-compétences comportementales' },
            { $set: { name: 'Comportementales' } }
        );

        await db.collection('macro_skill_type').insertOne(
            { name: 'Managériales', createdAt: new Date() }
        );

        await db.collection('macro_skill_type').updateOne(
            { name: 'Macro-compétences techniques' },
            { $set: { name: 'Techniques' } }
        );

        await db.collection('macro_skill_type').updateOne(
            { name: 'Macro-compétences QPSE' },
            { $set: { name: 'QPSE' } }
        );

        await db.collection('macro_skill_type').deleteOne({ name: 'Compétence technique' });
        await db.collection('macro_skill_type').deleteOne({ name: 'Compétence comportementale' });
        await db.collection('macro_skill_type').deleteOne({ name: 'Compétence QPSE' });

    }

    public async down(db: Db): Promise<void | never> {

    }
}
