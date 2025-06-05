import { google } from 'googleapis';
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { config } from '$lib/config';
import { auth_user, googleAccounts, googleCalendars } from '$lib/server/db/schema'; // Import auth_user
import { serverConfig } from '$lib/server/config';
import * as crypto from 'crypto';
import { auth } from '$lib/server/lucia';
import { eq } from 'drizzle-orm'; // Import eq for querying

const oauth2Client = new google.auth.OAuth2(
	serverConfig.auth.google.clientId,
	serverConfig.auth.google.clientSecret,
	config.auth.google.callbackUrl
);

export async function GET(event: RequestEvent) {
	const code = event.url.searchParams.get('code');
	const oauthError = event.url.searchParams.get('error');
	const userId = event.url.searchParams.get('state');

	if (oauthError) {
		throw redirect(303, `/settings?error=${encodeURIComponent(oauthError)}`);
	}

	if (!code || !userId) {
		throw error(400, 'Missing authorization code or user ID');
	}

	try {
		// Exchange authorization code for tokens
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);

		// Get user profile
		const people = google.people({ version: 'v1', auth: oauth2Client });
		const profile = await people.people.get({
			resourceName: 'people/me',
			personFields: 'emailAddresses'
		});

		const email = profile.data.emailAddresses?.[0]?.value;
		if (!email) {
			throw error(400, 'Could not retrieve email from Google profile');
		}

		// Find or create user in auth_user table
		let appUser = await db.select().from(auth_user).where(eq(auth_user.email, email)).then(rows => rows[0]);

		if (!appUser) {
			const newUserId = crypto.randomUUID();
			[appUser] = await db.insert(auth_user).values({
				id: newUserId,
				email: email,
				// Add any other required fields for auth_user, e.g., username if applicable
				// For now, assuming email is enough or other fields are nullable/have defaults
			}).returning();
		}

		// Store/update Google account credentials, linking to the appUser.id
		const [account] = await db
			.insert(googleAccounts)
			.values({
				id: crypto.randomUUID(),
				userId: appUser.id, // Use the appUser.id from auth_user table
				googleId: email // Or profile.data.id if available and preferred
			})
			.onConflictDoUpdate({
				target: googleAccounts.googleId, // Assuming googleId is unique for Google accounts
				set: {
					userId: appUser.id
				}
			})
			.returning();

		// Get list of Google Calendars
		const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
		const calendars = await calendar.calendarList.list();

		// Store calendars in database
		if (calendars.data.items) {
			for (const cal of calendars.data.items) {
				try {
					await db
						.insert(googleCalendars)
						.values({
							id: crypto.randomUUID(),
							accountId: account.id,
							calendarId: cal.id!
						})
						.onConflictDoUpdate({
							target: googleCalendars.calendarId,
							set: {
								calendarId: cal.id!
							}
						})
						.returning();
				} catch (err) {
					console.error('Error inserting calendar', err);
				}
			}
		}

		// Create a session for the user
		const session = await auth.createSession(appUser.id, {}); // Use appUser.id here
		const sessionCookie = auth.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/', // Changed from '.' to '/'
			...sessionCookie.attributes
		});

		throw redirect(303, '/settings?success=google-connected');
	} catch (error) {
		console.error('Google OAuth callback error:', error);
		throw redirect(303, `/settings?error=${encodeURIComponent('Failed to connect with Google')}`);
	}
}
