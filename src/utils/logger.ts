/**
 * Lightweight structured logger.
 *
 * Emits JSON lines to the console for machine-parseable log output
 * while keeping the implementation dependency-free.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function getMinLevel(): LogLevel {
  const envLevel = Deno.env.get('LOG_LEVEL')?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVEL_ORDER) {
    return envLevel as LogLevel;
  }
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[getMinLevel()];
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const consoleMethod = level === 'error'
    ? console.error
    : level === 'warn'
    ? console.warn
    : level === 'info'
    ? console.info
    : console.debug;

  consoleMethod(JSON.stringify(entry));
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    emit('debug', message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    emit('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    emit('warn', message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    emit('error', message, context);
  },
};
