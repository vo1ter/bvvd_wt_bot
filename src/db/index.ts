import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { eq, InferSelectModel } from 'drizzle-orm';
dotenv.config();

if(!process.env.DATABASE_URL) {
    throw new Error('Database URL is not defined in environment variables')
}

export const db = drizzle(process.env.DATABASE_URL!, {  schema });

export async function getUserByTelegramId(userTelegramId: number): Promise<User | undefined> {
    return await db.query.usersTable.findFirst({ where: eq(schema.usersTable.telegramId, userTelegramId) });
}

export async function createUser(userTelegramId: number): Promise<User["id"] | undefined> {
    const [result] = await db.insert(schema.usersTable).values({ telegramId: userTelegramId }).returning({ userId: schema.usersTable.id });

    // try to create the pet
    const petResult = await getPetByUser(result.userId);
    
    if(!petResult) await createPet(result.userId);

    return result.userId;
}

export async function getPetByUser(userId: string): Promise<Pet | undefined> {
    return await db.query.usersPetsTable.findFirst({ where: eq(schema.usersPetsTable.user_id, userId) });
}

export async function getPetByTelegramUser(telegramUserId: number): Promise<Pet | undefined> {
    const user = await getUserByTelegramId(telegramUserId);

    if(!user) throw new Error("No user with specified telegram id");

    return await db.query.usersPetsTable.findFirst({ where: eq(schema.usersPetsTable.user_id, user.id) });
}

export async function getPet(petId: string): Promise<Pet | undefined> {
    return await db.query.usersPetsTable.findFirst({ where: eq(schema.usersPetsTable.id, petId) });
}

export async function createPet(userId: string, name?: string): Promise<boolean> {
    try {
        await db.insert(schema.usersPetsTable).values({
            user_id: userId,
            name: (name) ? name : `${userId}'s BVVD`
        });
        return true;
    }
    catch(error: any) {
        console.log(`Error while trying to create a pet:\n${error.message}`)
        return false;
    }
}

type User = InferSelectModel<typeof schema.usersTable>;
type Pet = InferSelectModel<typeof schema.usersPetsTable>;