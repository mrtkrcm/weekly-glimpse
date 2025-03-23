import { createServer, type Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { db } from './db';
import { tasks } from './db/schema';
import type { SocketServer } from './socket';
import { serverConfig } from '$lib/server/config';
import { eq, and } from 'drizzle-orm';

let io: SocketServer | null = null;
let httpServer: HTTPServer | null = null;

export const initServer = (handler: any) => {
	if (httpServer) return { httpServer, io };

	// Create HTTP server
	httpServer = createServer(handler);

	// Initialize Socket.IO
	io = new Server(httpServer, {
		path: '/socket.io/',
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		},
		transports: ['websocket', 'polling'],
		addTrailingSlash: false
	});

	io.on('connection', (socket) => {
		console.log('a user connected');

		socket.on('join', async (room) => {
			socket.join(room);
			console.log(`user joined room: ${room}`);

			// When a user joins the calendar room, send them all current tasks
			if (room === 'calendar') {
				try {
					// Get all tasks from the database
					const allTasks = await db.select().from(tasks);
					console.log(`Sending ${allTasks.length} tasks to newly joined user`);

					// Send tasks to the newly connected user
					socket.emit('task updated', {
						room: 'calendar',
						tasks: allTasks
					});
				} catch (error) {
					console.error('Error fetching tasks for new user:', error);
				}
			}
		});

		socket.on('leave', (room) => {
			socket.leave(room);
			console.log(`user left room: ${room}`);
		});

		socket.on('task update', async (data) => {
			try {
				// Check if we're updating a single task or the entire array
				if (data.tasks && Array.isArray(data.tasks)) {
					console.log('Received task update with array:', data.tasks.length);

					// For each task in the array, ensure it belongs to the current user
					const userId = socket.data.user?.id;
					if (!userId) {
						throw new Error('Unauthorized: No user ID found');
					}

					for (const task of data.tasks) {
						// Ensure the task belongs to the current user
						if (task.userId !== userId) {
							console.warn('Unauthorized task update attempt:', task.id);
							continue;
						}

						try {
							// Validate the task data
							const validatedTask = taskSchema.parse(task);

							// Prepare the task data for database storage
							const dbTask = {
								...validatedTask,
								dueDate: validatedTask.dueDate ? new Date(validatedTask.dueDate) : new Date(),
								userId
							};

							if (task.id) {
								// Update existing task
								const { id, ...updateData } = dbTask;
								await db
									.update(tasks)
									.set(updateData)
									.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
									.returning();
							} else {
								// Insert new task
								await db.insert(tasks).values(dbTask).returning();
							}
						} catch (error) {
							console.error('Error validating or updating task:', error);
							socket.emit('error', { message: 'Failed to update task: Invalid data' });
						}
					}

					// Emit the updated tasks array to all clients in the room
					io?.to(data.room).emit('task updated', data);
				} else if (data.id) {
					// Handle single task update
					console.log('Received single task update:', data.id);

					const userId = socket.data.user?.id;
					if (!userId) {
						throw new Error('Unauthorized: No user ID found');
					}

					// Ensure the task belongs to the current user
					const existingTask = await db
						.select()
						.from(tasks)
						.where(and(eq(tasks.id, data.id), eq(tasks.userId, userId)))
						.limit(1);

					if (!existingTask.length) {
						throw new Error('Unauthorized or task not found');
					}

					// Prepare the task data for database storage
					const { id, ...updateData } = data;
					const dbUpdateData = {
						...updateData,
						dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
						userId
					};

					// Update the database
					await db
						.update(tasks)
						.set(dbUpdateData)
						.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
						.returning();

					// Emit the updated task
					io?.to(data.room).emit('task updated', data);
				}
			} catch (error) {
				console.error('Error updating task(s):', error);
				socket.emit('error', { message: 'Failed to update task(s)' });
			}
		});

		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
	});

	// Start listening
	const port = Number(serverConfig.socket.port);
	httpServer.listen(port);

	return { httpServer, io };
};

export const getServer = () => ({ httpServer, io });
