import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {
  const { week } = params;
  const result = await db.select().from(tasks).where(tasks.dueDate.between(week.start, week.end));
  return json(result);
};

export const POST = async ({ request }) => {
  const data = await request.json();
  const result = await db.insert(tasks).values(data).returning();
  return json(result);
};

export const PUT = async ({ request }) => {
  const data = await request.json();
  const result = await db.update(tasks).set(data).where(tasks.id.eq(data.id)).returning();
  return json(result);
};

export const DELETE = async ({ request }) => {
  const { id } = await request.json();
  const result = await db.delete(tasks).where(tasks.id.eq(id)).returning();
  return json(result);
};
