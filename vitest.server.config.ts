/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

// Server-side test configuration
export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/lib/server/**/*.{test,spec}.{js,ts}', 'src/routes/api/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['./vitest-server-setup.ts'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'.svelte-kit/**',
				'static/**',
				'coverage/**',
				'**/*.d.ts',
				'test/**',
				'vitest.config.ts',
				'vitest.server.config.ts'
			]
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			$app: path.resolve(__dirname, './src/app'),
			$tests: path.resolve(__dirname, './src/tests')
		}
	}
});
