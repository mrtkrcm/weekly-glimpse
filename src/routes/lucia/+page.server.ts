import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		try {
			// Find user by username
			const users = await db.select().from(user).where(eq(user.username, email));
			const foundUser = users[0];

			if (!foundUser) {
				return fail(400, { error: 'Invalid credentials' });
			}

			// Verify password
			const validPassword = await verify(foundUser.passwordHash, password);
			if (!validPassword) {
				return fail(400, { error: 'Invalid credentials' });
			}

			// Create session
			const session = await auth.createSession(foundUser.id, {});

			// Set session cookie
			const sessionCookie = auth.createSessionCookie(session.id);
			const { name, value, attributes } = sessionCookie;
			cookies.set(name, value, {
				path: '/',
				...attributes
			});

			return { success: true };
		} catch (error) {
			console.error('Login error:', error);
			return fail(400, { error: 'Invalid credentials' });
		}
	},
	logout: async ({ locals, cookies }) => {
		if (locals.session) {
			await auth.invalidateSession(locals.session.id);
			const { name, value, attributes } = auth.createBlankSessionCookie();
			cookies.set(name, value, {
				path: '/',
				...attributes
			});
		}
		throw redirect(302, '/');
	}
};
