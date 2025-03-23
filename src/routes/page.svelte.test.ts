import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

// Mock any dependencies the page component might have
vi.mock('$app/stores', () => ({
	page: { subscribe: vi.fn() }
}));

describe('/+page.svelte', () => {
	test.skip('should render h1', () => {
		render(Page);
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});
});
