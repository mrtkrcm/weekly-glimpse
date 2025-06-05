import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	username: string;
}

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	loading: boolean;
}

// Initialize with persisted state if available
const initialState: AuthState = browser
	? JSON.parse(
			localStorage.getItem('auth') || '{ "isAuthenticated": false, "user": null, "loading": true }'
		)
	: { isAuthenticated: false, user: null, loading: true };

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,

		login: (user: User) => {
			const newState = { isAuthenticated: true, user, loading: false };
			if (browser) localStorage.setItem('auth', JSON.stringify(newState));
			set(newState);
		},

		logout: () => {
			const newState = { isAuthenticated: false, user: null, loading: false };
			if (browser) localStorage.setItem('auth', JSON.stringify(newState));
			set(newState);
		},

		setLoading: (loading: boolean) => {
			update((state) => {
				const newState = { ...state, loading };
				if (browser) localStorage.setItem('auth', JSON.stringify(newState));
				return newState;
			});
		},

		// Check session status - would be called during app initialization
		checkSession: async () => {
			try {
				// Make an API call to verify the user's session
				const response = await fetch('/api/auth/session');
				if (response.ok) {
					const userData = await response.json();
					const newState = {
						isAuthenticated: true,
						user: userData,
						loading: false
					};
					if (browser) localStorage.setItem('auth', JSON.stringify(newState));
					set(newState);
				} else {
					const newState = {
						isAuthenticated: false,
						user: null,
						loading: false
					};
					if (browser) localStorage.setItem('auth', JSON.stringify(newState));
					set(newState);
				}
			} catch (error) {
				console.error('Error checking session:', error);
				const newState = {
					isAuthenticated: false,
					user: null,
					loading: false
				};
				if (browser) localStorage.setItem('auth', JSON.stringify(newState));
				set(newState);
			}
		}
	};
}

export const authStore = createAuthStore();
