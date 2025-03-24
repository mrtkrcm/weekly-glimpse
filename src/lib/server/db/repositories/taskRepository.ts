import { db, sql } from '../db';
import { tasks } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function getTasks(
  userId: string,
  { page = 1, limit = 20, status, startDate, endDate }: { page?: number; limit?: number; status?: string; startDate?: Date; endDate?: Date } = {}
) {
  const offset = (page - 1) * limit;
  const whereConditions = [eq(tasks.userId, userId)];
  if (status) {
    whereConditions.push(eq(tasks.status, status));
  }
  if (startDate) {
    whereConditions.push(gte(tasks.dueDate, startDate));
  }
  if (endDate) {
    whereConditions.push(lte(tasks.dueDate, endDate));
  }

  const countResult = await db.select({ count: sql`count(*)` })
    .from(tasks)
    .where(and(...whereConditions));
  const totalItems = Number(countResult[0].count);
  const totalPages = Math.ceil(totalItems / limit);

  const results = await db.select()
    .from(tasks)
    .where(and(...whereConditions))
    .limit(limit)
    .offset(offset)
    .orderBy(tasks.dueDate);

  return {
    data: results,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages
    }
  };
}
