import { google } from 'googleapis';
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { googleAccounts } from '$lib/server/db/schema';
import { config } from '$lib/config';
import { serverConfig } from '$lib/server/config';

const oauth2Client = new google.auth.OAuth2(
	serverConfig.auth.google.clientId,
	serverConfig.auth.google.clientSecret,
	config.auth.google.callbackUrl
);

// Scopes we need for Google Calendar integration
const SCOPES = [
	'https://www.googleapis.com/auth/calendar.readonly',
	'https://www.googleapis.com/auth/calendar.events.readonly'
];

export async function GET(event: RequestEvent) {
	// Generate a URL for Google OAuth consent screen
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline', // This will give us a refresh token
		scope: SCOPES,
		// Include the user ID in the state parameter to identify the user after redirect
		state: event.locals.user?.id || '',
		prompt: 'consent' // Always show consent screen to get refresh token
	});

	throw redirect(302, authUrl);
}
