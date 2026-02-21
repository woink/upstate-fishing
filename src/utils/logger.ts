/**
 * Lightweight structured logger.
 *
 * Emits JSON lines to the console for machine-parseable log output
 * while keeping the implementation dependency-free.
 *
 * In development (no DENO_DEPLOYMENT_ID), outputs human-readable
 * colored lines instead of JSON.
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

export function isDevMode(): boolean {
  return !Deno.env.get('DENO_DEPLOYMENT_ID');
}

function getMinLevel(): LogLevel {
  const envLevel = Deno.env.get('LOG_LEVEL')?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVEL_ORDER) {
    return envLevel as LogLevel;
  }
  return isDevMode() ? 'debug' : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[getMinLevel()];
}

// ANSI color codes for dev-mode pretty printing
const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // gray
  info: '\x1b[34m', // blue
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function formatPretty(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): string {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8); // HH:MM:SS
  const color = COLORS[level];
  const levelStr = level.toUpperCase().padEnd(5);

  let line = `${color}[${time}] ${levelStr}${RESET} ${message}`;

  if (context && Object.keys(context).length > 0) {
    const pairs = Object.entries(context)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' ');
    line += ` ${pairs}`;
  }

  return line;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const consoleMethod = level === 'error'
    ? console.error
    : level === 'warn'
    ? console.warn
    : level === 'info'
    ? console.info
    : console.debug;

  if (isDevMode()) {
    consoleMethod(formatPretty(level, message, context));
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

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
