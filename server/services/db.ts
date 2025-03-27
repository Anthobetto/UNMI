import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Strongly typed database access layer
export const dbService = {
  users: {
    async getById(id: number) {
      try {
        const result = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, id)
        });
        return result;
      } catch (error) {
        console.error('Error in users.getById:', error);
        return null;
      }
    },

    async getByEmail(email: string) {
      try {
        const result = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.username, email)
        });
        return result;
      } catch (error) {
        console.error('Error in users.getByEmail:', error);
        return null;
      }
    }
  },

  calls: {
    async getByUser(userId: number) {
      return await db.query.calls.findMany({
        where: (calls, { eq }) => eq(calls.userId, userId)
      });
    },

    async create(data: typeof schema.calls.$inferInsert) {
      const [result] = await db.insert(schema.calls).values(data).returning();
      return result;
    }
  },

  messages: {
    async getByUser(userId: number) {
      return await db.query.messages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId)
      });
    },

    async create(data: typeof schema.messages.$inferInsert) {
      const [result] = await db.insert(schema.messages).values(data).returning();
      return result;
    }
  },

  contents: {
    async getAll(userId: number) {
      return await db.query.contents.findMany({
        where: (contents, { eq }) => eq(contents.userId, userId)
      });
    },

    async getByCategory(userId: number, category: string) {
      return await db.query.contents.findMany({
        where: (contents, { and, eq }) => and(
          eq(contents.userId, userId),
          eq(contents.category, category)
        )
      });
    },

    async create(data: typeof schema.contents.$inferInsert) {
      const [result] = await db.insert(schema.contents).values(data).returning();
      return result;
    }
  }
};