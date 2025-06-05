import { vi } from 'vitest';

export const onMount = vi.fn((callback) => callback());
export const onDestroy = vi.fn();
export const tick = vi.fn();
export const createEventDispatcher = vi.fn(() => vi.fn());
export const getContext = vi.fn();
export const setContext = vi.fn();
export const hasContext = vi.fn();
export const getAllContexts = vi.fn();
export const getStores = vi.fn();
export const get = vi.fn();
export const derived = vi.fn();
export const readable = vi.fn();
export const writable = vi.fn();
