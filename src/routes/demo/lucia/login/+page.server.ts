import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as auth_user } from '$lib/server/db/schema';
import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/lucia');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username (min 3, max 31 characters, alphanumeric only)'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
		}

		const results = await db
			.select()
.from(auth_user)
.where(eq(auth_user.username, username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

const session = await auth.createSession(existingUser.id, {});
const sessionCookie = auth.createSessionCookie(session.id);
event.cookies.set(sessionCookie.name, sessionCookie.value, {
  path: '/',
  ...sessionCookie.attributes
});

		return redirect(302, '/demo/lucia');
	},
	register: async (event) => {
		try {
			const formData = await event.request.formData();
			const username = formData.get('username');
			const password = formData.get('password');

			// Validate input with detailed error messages
			if (!validateUsername(username)) {
				return fail(400, {
					message:
						'Username must be 3-31 characters long and contain only letters, numbers, underscores, or hyphens',
					field: 'username'
				});
			}
			if (!validatePassword(password)) {
				return fail(400, {
					message: 'Password must be at least 6 characters long',
					field: 'password'
				});
			}

			// Check if username already exists
			const results = await db
				.select()
				.from(auth_user)
				.where(eq(auth_user.username, username))
				.limit(1);

			if (results.length > 0) {
				return fail(400, {
					message: 'Username already taken',
					field: 'username'
				});
			}

			// Generate user ID and hash password
			const userId = generateUserId();
			const passwordHash = await hash(password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			// Create new user
			await db.insert(auth_user).values({
				id: userId,
				username: username as string,
				passwordHash
			});

			// Create session
const session = await auth.createSession(userId, {});
const sessionCookie = auth.createSessionCookie(session.id);
event.cookies.set(sessionCookie.name, sessionCookie.value, {
  path: '/',
  ...sessionCookie.attributes
});

			return redirect(302, '/demo/lucia');
		} catch (e) {
			console.error('Registration error:', e);

			// Handle specific database errors
			if (e instanceof Error && e.message.includes('unique constraint')) {
				return fail(400, {
					message: 'Username already taken',
					field: 'username'
				});
			}

			return fail(500, {
				message: 'Failed to create account. Please try again later.',
				error: process.env.NODE_ENV === 'development' ? e.message : undefined
			});
		}
	}
};

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
