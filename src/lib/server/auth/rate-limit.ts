import { createAppError, ErrorCode } from '$lib/server/utils/errors';

const attempts = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): void {
	const now = Date.now();
	const record = attempts.get(ip) || { count: 0, reset: now + windowMs };

	if (now > record.reset) {
		attempts.set(ip, { count: 1, reset: now + windowMs });
		return;
	}

	record.count++;
	attempts.set(ip, record);

	if (record.count > maxAttempts) {
		throw createAppError('Too many attempts, please try again later', ErrorCode.UNAUTHORIZED, 429, {
			resetAt: record.reset
		});
	}
}
