import { browser } from '$app/environment';

// Safe access to environment variables
let PUBLIC_SOCKET_PORT: string | undefined;
let PUBLIC_SOCKET_HOST: string | undefined;
let PUBLIC_GOOGLE_CALLBACK_URL: string | undefined;

try {
	// These are dynamically accessed at runtime to prevent build errors
	if (!browser) {
		const env = process.env;
		PUBLIC_SOCKET_PORT = env.PUBLIC_SOCKET_PORT;
		PUBLIC_SOCKET_HOST = env.PUBLIC_SOCKET_HOST;
		PUBLIC_GOOGLE_CALLBACK_URL = env.PUBLIC_GOOGLE_CALLBACK_URL;
	}
} catch (e) {
	console.log('Environment variables not available during build');
}

export const config = {
	socket: {
		port: PUBLIC_SOCKET_PORT || '4174',
		host: PUBLIC_SOCKET_HOST || 'localhost',
		path: '/socket.io/'
	},
	auth: {
		google: {
			callbackUrl:
				PUBLIC_GOOGLE_CALLBACK_URL || 'http://localhost:5173/api/auth/google/callback'
		}
	},
	test: {
		port: 4173,
		baseUrl: 'http://localhost:4173'
	}
} as const;
