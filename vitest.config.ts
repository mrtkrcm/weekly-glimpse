/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// Client-side test configuration
export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      compilerOptions: {
        hydratable: true
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.svelte.test.{js,ts}', 'src/routes/**/*.svelte.test.{js,ts}'],
    exclude: ['src/lib/server/**/*', 'src/routes/api/**/*'],
    setupFiles: ['vitest-setup-client.ts'],
    deps: {
      inline: [/^svelte/]
    }
  },
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, './src/lib'),
      '$app': path.resolve(__dirname, './src/app'),
      '$tests': path.resolve(__dirname, './src/tests')
    },
    conditions: ['browser']
  }
});
