import type { usersPetsTable, usersTable } from './schema';
import { type InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof usersTable>;
export type Pet = InferSelectModel<typeof usersPetsTable>;