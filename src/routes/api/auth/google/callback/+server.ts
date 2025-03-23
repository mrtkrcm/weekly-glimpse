import { google } from 'googleapis';
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { googleAccounts, googleCalendars } from '$lib/server/db/schema';
import { config } from '$lib/config';
import { serverConfig } from '$lib/server/config';

const oauth2Client = new google.auth.OAuth2(
	serverConfig.auth.google.clientId,
	serverConfig.auth.google.clientSecret,
	config.auth.google.callbackUrl
);

export async function GET(event: RequestEvent) {
	const { code, error: oauthError, state: userId } = event.url.searchParams;

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

		// Store/update Google account credentials
		const [account] = await db
			.insert(googleAccounts)
			.values({
				userId,
				accessToken: tokens.access_token!,
				refreshToken: tokens.refresh_token!,
				expiresAt: new Date(tokens.expiry_date!),
				scope: tokens.scope!
			})
			.onConflictDoUpdate({
				target: googleAccounts.userId,
				set: {
					accessToken: tokens.access_token!,
					refreshToken: tokens.refresh_token!,
					expiresAt: new Date(tokens.expiry_date!),
					scope: tokens.scope!,
					updated_at: new Date()
				}
			})
			.returning();

		// Get list of Google Calendars
		const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
		const calendars = await calendar.calendarList.list();

		// Store calendars in database
		if (calendars.data.items) {
			for (const cal of calendars.data.items) {
				await db
					.insert(googleCalendars)
					.values({
						googleAccountId: account.id,
						googleCalendarId: cal.id!,
						name: cal.summary!,
						description: cal.description || '',
						syncEnabled: true
					})
					.onConflictDoUpdate({
						target: googleCalendars.googleCalendarId,
						set: {
							name: cal.summary!,
							description: cal.description || '',
							updated_at: new Date()
						}
					});
			}
		}

		throw redirect(303, '/settings?success=google-connected');
	} catch (err) {
		console.error('Google OAuth callback error:', err);
		throw redirect(303, `/settings?error=${encodeURIComponent('Google connection failed')}`);
	}
}
