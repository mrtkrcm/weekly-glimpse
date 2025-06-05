import { io } from 'socket.io-client';
import { config } from './config';
import type { ClientToServerEvents, ServerToClientEvents } from './types/socket';

/**
 * Configured Socket.IO client with proper typing
 */
export const socket = io({
	port: config.socket.port,
	host: config.socket.host,
	path: config.socket.path,
	autoConnect: true,
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000
}) as unknown as SocketIOClient.Socket<ServerToClientEvents, ClientToServerEvents>;
