// Mock for $app/environment
export const browser = true;
export const dev = true;
export const building = false;

// Mock for $app/navigation
export const goto = vi.fn();
export const beforeNavigate = vi.fn();
export const afterNavigate = vi.fn();

// Mock for $app/stores
import { readable } from 'svelte/store';
export const page = readable({});
export const navigating = readable(null);
export const updated = readable(false);
