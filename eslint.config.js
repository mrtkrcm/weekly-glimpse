import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
	{
		ignores: [
			'dist/**',
			'.svelte-kit/**',
			'node_modules/**',
			'*.min.js',
			'coverage/**',
			'.history/**',
			'static/**',
			'playwright-report/**',
			'test-results/**',
			'build/**',
			'drizzle/**'
		]
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.es2020,
				...globals.node
			},
			parser: tsParser,
			parserOptions: {
				extraFileExtensions: ['.svelte']
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
		}
	},
	{
		files: ['**/*.svelte'],
		plugins: {
			svelte: sveltePlugin
		},
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': 'off'
		}
	}
];
