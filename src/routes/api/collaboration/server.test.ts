import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { GET } from './+server';

// Mock database
vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([
					{
						id: 'mock-task-1',
						title: 'Updated Task'
					}
				])
			})
		})
	}
}));

describe('Collaboration API', () => {
	let io: Server;
	let mockSocket: any;

	beforeEach(() => {
		// Create a new Socket.IO server instance for each test
		io = new Server();

		// Create mock socket
		mockSocket = {
			id: 'mock-socket-id',
			join: vi.fn(),
			emit: vi.fn(),
			to: vi.fn().mockReturnThis(),
			broadcast: { to: vi.fn().mockReturnThis(), emit: vi.fn() }
		};

		// Set up the connection handler
		io.on('connection', (socket) => {
			socket.on('join', (room) => {
				socket.join(room);
				socket.emit('join', room);
			});

			socket.on('task update', (data) => {
				io.to(data.room).emit('task updated', data);
			});
		});
	});

	afterEach(() => {
		// Clean up after each test
		if (io) {
			io.close();
		}
		vi.clearAllMocks();
	});

	it('Real-time Task Update', async () => {
		// Mock io.to() for emitting to rooms
		vi.spyOn(io, 'to').mockReturnValue(mockSocket);

		// Simulate task update event
		io.emit('task update', {
			room: 'calendar',
			id: 'mock-task-1',
			title: 'Updated Task'
		});

		expect(io.to).toHaveBeenCalledWith('calendar');
		expect(mockSocket.emit).toHaveBeenCalled();
	});

	it('Join Room', () => {
		// Simulate client joining a room
		const connectionCallback = vi.fn();
		io.on('connection', connectionCallback);

		// Manually trigger the connection callback
		connectionCallback(mockSocket);

		// Simulate join event
		const joinEvent = vi.fn();
		mockSocket.on = vi.fn().mockImplementation((event, callback) => {
			if (event === 'join') {
				joinEvent.mockImplementation(callback);
			}
			return mockSocket;
		});

		joinEvent('calendar');

		expect(mockSocket.join).toHaveBeenCalledWith('calendar');
	});

	it('GET Handler Returns Socket.IO Client Script', async () => {
		const response = await GET();
		expect(response.status).toBe(200);
	});
});
