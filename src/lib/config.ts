import { env as publicEnv } from '$env/dynamic/public';

export const config = {
	socket: {
		port: publicEnv.VITE_SOCKET_PORT || 30001,
		host: publicEnv.VITE_SOCKET_HOST || 'localhost',
		path: '/socket.io/'
	},
	auth: {
		google: {
			callbackUrl:
				publicEnv.VITE_GOOGLE_CALLBACK_URL || 'http://localhost:5173/api/auth/google/callback'
		}
	},
	test: {
		port: 4173,
		baseUrl: 'http://localhost:4173'
	}
} as const;
