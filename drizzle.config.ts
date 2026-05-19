import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

if(!process.env.DATABASE_URL) {
    throw new Error('Database URL is not defined in environment variables')
}

export default defineConfig({
    out: './dest/drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL
    },
});