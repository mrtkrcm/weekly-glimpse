import { writable } from 'svelte/store';
import type { Task } from '../../types/task';

export const tasks = writable<Task[]>([]);
