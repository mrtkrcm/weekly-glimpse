import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { WebSocket } from 'ws';
import type { Socket as ClientSocket } from 'socket.io-client';
import { db } from './db';
import { tasks } from './db/schema';

interface ServerToClientEvents {
	'task updated': (data: any) => void;
}

interface ClientToServerEvents {
	join: (room: string) => void;
	leave: (room: string) => void;
	'task update': (data: any) => void;
}

interface InterServerEvents {
	ping: () => void;
}

interface SocketData {
	userId: string;
}

export type SocketServer = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

let io: SocketServer | null = null;

export const initSocketServer = (server: HTTPServer) => {
	if (io) return io;

	io = new Server(server, {
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

		socket.on('join', (room) => {
			socket.join(room);
			console.log(`user joined room: ${room}`);
		});

		socket.on('leave', (room) => {
			socket.leave(room);
			console.log(`user left room: ${room}`);
		});

		socket.on('task update', async (data) => {
			const { id, ...updateData } = data;
			await db.update(tasks).set(updateData).where(tasks.id.eq(id));
			io?.to(data.room).emit('task updated', data);
		});

		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
	});

	return io;
};

export const getSocketServer = () => io;
