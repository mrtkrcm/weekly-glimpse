import type { RequestHandler } from '@sveltejs/kit';
import { getServer } from '$lib/server/server';

export const GET: RequestHandler = async ({ request }) => {
	const { io } = getServer();

	if (!io) {
		return new Response('WebSocket server not initialized', { status: 500 });
	}

	return new Response('WebSocket server is running', {
		headers: {
			'content-type': 'text/plain',
			'Access-Control-Allow-Origin': '*'
		}
	});
};
