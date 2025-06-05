import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	// Check if the user has an active session
	if (locals.user) {
		// Return user data without sensitive information
		return json({
			id: locals.user.id,
			username: locals.user.username
		});
	}

	// Return 401 if not authenticated
	return new Response(
		JSON.stringify({
			error: 'Unauthorized',
			message: 'Not authenticated'
		}),
		{
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
