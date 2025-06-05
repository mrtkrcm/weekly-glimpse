/**
 * Test utilities for Svelte components
 */

import { compile } from 'svelte/compiler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a Svelte component dynamically for testing purposes
 * @param code The Svelte component code as a string
 * @param options Additional compiler options
 * @returns The compiled Svelte component
 */
export function createSvelteComponent(code: string, options = {}) {
	// Create a temporary file name
	const tempFilename = path.join(__dirname, 'temp', `TempComponent-${Date.now()}.svelte`);

	// Ensure the temp directory exists
	const tempDir = path.dirname(tempFilename);
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true });
	}

	// Write the component code to a file
	fs.writeFileSync(tempFilename, code);

	try {
		// Compile the component
		const { js } = compile(code, {
			filename: tempFilename,
			...options
		});

		// Create a component constructor
		const Component = new Function(
			'module',
			'exports',
			'require',
			js.code + '\nreturn module.exports.default;'
		)({ exports: {} }, {}, () => ({}));

		return Component;
	} finally {
		// Clean up the temporary file
		try {
			if (fs.existsSync(tempFilename)) {
				fs.unlinkSync(tempFilename);
			}
		} catch (e) {
			console.warn('Failed to remove temporary component file:', e);
		}
	}
}
