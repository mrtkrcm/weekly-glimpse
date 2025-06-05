import { dev } from '$app/environment';

export enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR'
}

export interface LogContext {
	component?: string;
	userId?: string;
	requestId?: string;
	[key: string]: any;
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	error?: Error;
}

class Logger {
	private static instance: Logger;
	private logBuffer: LogEntry[] = [];
	private readonly MAX_BUFFER_SIZE = 1000;

	private constructor() {
		// Initialize any external logging services here
		this.setupErrorHandlers();
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	private setupErrorHandlers() {
		if (typeof window !== 'undefined') {
			window.addEventListener('unhandledrejection', (event) => {
				this.error('Unhandled Promise Rejection', {
					error: event.reason,
					context: { type: 'unhandledrejection' }
				});
			});

			window.addEventListener('error', (event) => {
				this.error('Uncaught Error', {
					error: event.error,
					context: { type: 'uncaught' }
				});
			});
		}
	}

	private formatError(error: Error): any {
		return {
			name: error.name,
			message: error.message,
			stack: dev ? error.stack : undefined,
			cause: error.cause
		};
	}

	private createLogEntry(
		level: LogLevel,
		message: string,
		options?: { context?: LogContext; error?: Error }
	): LogEntry {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: options?.context
		};

		if (options?.error) {
			entry.error = options.error;
		}

		return entry;
	}

	private async persistLog(entry: LogEntry) {
		// Add to buffer
		this.logBuffer.push(entry);
		if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
			this.logBuffer.shift();
		}

		// Console output for development
		if (dev) {
			const consoleMethod = {
				[LogLevel.DEBUG]: console.debug,
				[LogLevel.INFO]: console.info,
				[LogLevel.WARN]: console.warn,
				[LogLevel.ERROR]: console.error
			}[entry.level];

			consoleMethod(
				`[${entry.level}] ${entry.message}`,
				entry.context,
				entry.error ? this.formatError(entry.error) : ''
			);
		}

		// Here you would typically send logs to your logging service
		// await this.sendToLoggingService(entry);
	}

	public debug(message: string, context?: LogContext) {
		const entry = this.createLogEntry(LogLevel.DEBUG, message, { context });
		this.persistLog(entry);
	}

	public info(message: string, context?: LogContext) {
		const entry = this.createLogEntry(LogLevel.INFO, message, { context });
		this.persistLog(entry);
	}

	public warn(message: string, options?: { context?: LogContext; error?: Error }) {
		const entry = this.createLogEntry(LogLevel.WARN, message, options);
		this.persistLog(entry);
	}

	public error(message: string, options?: { context?: LogContext; error?: Error }) {
		const entry = this.createLogEntry(LogLevel.ERROR, message, options);
		this.persistLog(entry);
	}

	public getRecentLogs(count: number = 100): LogEntry[] {
		return this.logBuffer.slice(-count);
	}

	public async flush(): Promise<void> {
		// Implement if you need to ensure all logs are persisted
		// await this.sendToLoggingService(this.logBuffer);
		this.logBuffer = [];
	}
}

export const logger = Logger.getInstance();
