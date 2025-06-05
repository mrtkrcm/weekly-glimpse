import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import * as dotenv from 'dotenv';
import { configDefaults } from 'vitest/config';

// Load environment variables explicitly
dotenv.config();

// Log environment variables for debugging
// console.log('Environment variables loaded:');
// console.log('DATABASE_URL:', process.env.DATABASE_URL);
// console.log('NODE_ENV:', process.env.NODE_ENV);

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			$app: path.resolve(__dirname, './src/app'),
			'$env/dynamic/private': path.resolve(__dirname, './src/tests/mocks/env.ts')
		}
	},
	build: {
		rollupOptions: {
			external: ['googleapis', '@lucia-auth/adapter-drizzle', 'lucia', 'socket.io', '@sentry/node']
		}
	},
	// Enable environment variables explicitly in Vite
	envPrefix: ['VITE_', 'DATABASE_', 'GOOGLE_', 'SENTRY_', 'TEST_USER_', 'NODE_'],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/lib/tests/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [...configDefaults.exclude],
		alias: {
			$app: path.resolve(__dirname, './src/lib/tests/mocks/app.ts'),
			$lib: path.resolve(__dirname, './src/lib')
		}
	}
});
