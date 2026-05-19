import type { Pet } from "db/types";
import { eq } from "drizzle-orm";
import { db } from "db/index";
import { getUserByTelegramId } from "lib/user";
import { usersPetsTable } from "db/schema";


export async function createPet(userId: string, name?: string): Promise<boolean> {
  try {
    await db.insert(usersPetsTable).values({
      user_id: userId,
      name: (name) ? name : `${userId}'s BVVD`
    });
    return true;
  }
  catch (error: any) {
    console.log("Error while trying to create a pet:\n", error.message)
    return false;
  }
}

export async function getPetByUser(userId: string): Promise<Pet | undefined> {
  return await db.query.usersPetsTable.findFirst({ where: eq(usersPetsTable.user_id, userId) });
}

export async function getPetByTelegramUser(telegramUserId: number): Promise<Pet | undefined> {
  const user = await getUserByTelegramId(telegramUserId);
  if (!user) throw new Error("No user with specified telegram id");

  return await db.query.usersPetsTable.findFirst({ where: eq(usersPetsTable.user_id, user.id) });
}

export async function getPet(petId: string): Promise<Pet | undefined> {
  return await db.query.usersPetsTable.findFirst({ where: eq(usersPetsTable.id, petId) });
}