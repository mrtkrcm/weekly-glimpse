import { format, parseISO, isValid } from 'date-fns';
import { DATE_FORMATS } from '../constants';

/**
 * Formats a date using the application's standard date formats
 */
export function formatDate(date: Date | string, formatType: keyof typeof DATE_FORMATS): string {
	const dateObj = typeof date === 'string' ? parseISO(date) : date;

	if (!isValid(dateObj)) {
		return '';
	}

	return format(dateObj, DATE_FORMATS[formatType]);
}

/**
 * Safely parses an ISO date string to a Date object
 */
export function parseDate(dateStr: string): Date | null {
	try {
		const date = parseISO(dateStr);
		return isValid(date) ? date : null;
	} catch (e) {
		return null;
	}
}
