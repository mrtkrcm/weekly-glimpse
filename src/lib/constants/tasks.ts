export const DEFAULT_PRIORITIES = ['low', 'medium', 'high'] as const;

// Priority settings
export const PRIORITY_CONFIG = {
	low: {
		color: 'bg-green-100 text-green-800',
		icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8m-2 12l-4-4m0 0l-4 4m4-4v8'
	},
	medium: {
		color: 'bg-amber-100 text-amber-800',
		icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
	},
	high: {
		color: 'bg-red-100 text-red-800',
		icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
	}
};
