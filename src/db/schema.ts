import { bigint, pgTable, real, text, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    telegramId: bigint({ mode: "number" }),
    discordId: bigint({ mode: "number" })
});

export const usersPetsTable = pgTable("users_pets", {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid().references(() => usersTable.id),
    weight: real().notNull().default(1.0),
    name: text().notNull()
});

// export const chatsTable = pgTable("chats", {
//     id: integer().primaryKey().notNull()
// });

// export const chatsPetsTable = pgTable("chats_pets", {
//     id: integer().primaryKey().notNull(),
//     chat_id: integer().notNull(),
//     weight: real().notNull().default(1.0),
//     name: text().notNull()
// });