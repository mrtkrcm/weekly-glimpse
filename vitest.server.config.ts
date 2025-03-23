/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

// Server-side test configuration
export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/lib/server/**/*.test.{js,ts}', 'src/routes/api/**/*.test.{js,ts}'],
		setupFiles: ['vitest-setup-server.ts'],
		deps: {
			inline: true
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			$app: path.resolve(__dirname, './src/app'),
			'$env/dynamic/private': path.resolve(__dirname, './src/tests/mocks/env.ts')
		}
	}
});
