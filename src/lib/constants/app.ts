export const APP_NAME = 'Weekly Glimpse';

// App-wide settings with defaults
export const APP_SETTINGS = {
	defaultView: 'week' as 'week' | 'month',
	weekStartsOn: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6, // Monday
	showWeekends: true,
	enableDarkMode: false,
	enableNotifications: true,
	showCompletedTasks: true
};
