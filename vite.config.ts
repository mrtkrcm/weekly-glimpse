import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
		environment: 'jsdom',
		setupFiles: ['src/tests/setup.ts'],
		globals: true,
		css: true,
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			$app: path.resolve(__dirname, './src/app')
		},
		deps: {
			inline: [/^svelte/]
		},
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/tests/setup.ts']
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
