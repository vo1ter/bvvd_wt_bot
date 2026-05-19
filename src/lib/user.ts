import type { User } from "db/types";
import { eq } from "drizzle-orm";
import { db } from "db/index";
import { getPetByUser, createPet } from "lib/pet";
import { usersTable } from "db/schema";


export async function createUser(userTelegramId: number): Promise<User["id"] | undefined> {
  const [result] = await db.insert(usersTable).values({ telegramId: userTelegramId }).returning({ userId: usersTable.id });

  if (!result) return;

  const petResult = await getPetByUser(result.userId);
  if (!petResult) await createPet(result.userId);

  return result.userId;
}

export async function getUserByTelegramId(userTelegramId: number): Promise<User | undefined> {
  return await db.query.usersTable.findFirst({ where: eq(usersTable.telegramId, userTelegramId) });
}