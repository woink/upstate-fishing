/**
 * Logger utility tests
 */

import { assertEquals, assertExists, assertStringIncludes } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { _resetMinLevel, createRequestLogger, logger } from '@shared/utils/logger.ts';

describe('logger', () => {
  let captured: string[] = [];
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  // Force production mode (JSON output) for most tests
  beforeEach(() => {
    Deno.env.set('DENO_DEPLOYMENT_ID', 'test-deployment');
    Deno.env.delete('LOG_LEVEL');
    _resetMinLevel();
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
    console.info = originalInfo;
    console.debug = originalDebug;
    captured = [];
    Deno.env.delete('DENO_DEPLOYMENT_ID');
    Deno.env.delete('LOG_LEVEL');
  });

  describe('warn()', () => {
    it('writes JSON to console.warn with correct level and message', () => {
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.warn('something happened');

      assertEquals(captured.length, 1);
      const entry = JSON.parse(captured[0]);
      assertEquals(entry.level, 'warn');
      assertEquals(entry.message, 'something happened');
      assertExists(entry.timestamp);
    });

    it('includes an ISO timestamp', () => {
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.warn('ts check');

      const entry = JSON.parse(captured[0]);
      const parsed = new Date(entry.timestamp);
      assertEquals(isNaN(parsed.getTime()), false, 'timestamp should be a valid date');
    });

    it('spreads context keys into the log entry', () => {
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.warn('with context', { stream: 'Esopus Creek', region: 'catskills' });

      const entry = JSON.parse(captured[0]);
      assertEquals(entry.stream, 'Esopus Creek');
      assertEquals(entry.region, 'catskills');
      assertEquals(entry.level, 'warn');
      assertEquals(entry.message, 'with context');
    });

    it('works without context argument', () => {
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.warn('no context');

      assertEquals(captured.length, 1);
      const entry = JSON.parse(captured[0]);
      assertEquals(entry.level, 'warn');
      assertEquals(entry.message, 'no context');
    });
  });

  describe('error()', () => {
    it('writes JSON to console.error with correct level and message', () => {
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.error('something broke');

      assertEquals(captured.length, 1);
      const entry = JSON.parse(captured[0]);
      assertEquals(entry.level, 'error');
      assertEquals(entry.message, 'something broke');
      assertExists(entry.timestamp);
    });

    it('includes an ISO timestamp', () => {
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.error('ts check');

      const entry = JSON.parse(captured[0]);
      const parsed = new Date(entry.timestamp);
      assertEquals(isNaN(parsed.getTime()), false, 'timestamp should be a valid date');
    });

    it('spreads context keys into the log entry', () => {
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.error('fail', { code: 500, endpoint: '/api/streams' });

      const entry = JSON.parse(captured[0]);
      assertEquals(entry.code, 500);
      assertEquals(entry.endpoint, '/api/streams');
      assertEquals(entry.level, 'error');
      assertEquals(entry.message, 'fail');
    });

    it('works without context argument', () => {
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.error('bare error');

      assertEquals(captured.length, 1);
      const entry = JSON.parse(captured[0]);
      assertEquals(entry.level, 'error');
      assertEquals(entry.message, 'bare error');
    });
  });

  describe('info()', () => {
    it('writes JSON to console.info with correct level and message', () => {
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.info('informational message');

      assertEquals(captured.length, 1);
      const entry = JSON.parse(captured[0]);
      assertEquals(entry.level, 'info');
      assertEquals(entry.message, 'informational message');
      assertExists(entry.timestamp);
    });

    it('spreads context keys into the log entry', () => {
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.info('request received', { method: 'GET', path: '/api/streams' });

      const entry = JSON.parse(captured[0]);
      assertEquals(entry.method, 'GET');
      assertEquals(entry.path, '/api/streams');
    });
  });

  describe('debug()', () => {
    it('writes JSON to console.debug with correct level and message', () => {
      Deno.env.set('LOG_LEVEL', 'debug');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('debug trace');

      assertEquals(captured.length, 1);
      const entry = JSON.parse(captured[0]);
      assertEquals(entry.level, 'debug');
      assertEquals(entry.message, 'debug trace');
      assertExists(entry.timestamp);
    });

    it('spreads context keys into the log entry', () => {
      Deno.env.set('LOG_LEVEL', 'debug');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('cache lookup', { key: 'usgs:01234' });

      const entry = JSON.parse(captured[0]);
      assertEquals(entry.key, 'usgs:01234');
    });
  });

  describe('does not cross-contaminate console methods', () => {
    it('warn() does not write to console.error', () => {
      const errorCalls: string[] = [];
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.error = (...args: unknown[]) => {
        errorCalls.push(String(args[0]));
      };

      logger.warn('only warn');

      assertEquals(captured.length, 1);
      assertEquals(errorCalls.length, 0);
    });

    it('error() does not write to console.warn', () => {
      const warnCalls: string[] = [];
      console.warn = (...args: unknown[]) => {
        warnCalls.push(String(args[0]));
      };
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.error('only error');

      assertEquals(captured.length, 1);
      assertEquals(warnCalls.length, 0);
    });

    it('info() writes to console.info, not console.warn or console.error', () => {
      const warnCalls: string[] = [];
      const errorCalls: string[] = [];
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.warn = (...args: unknown[]) => {
        warnCalls.push(String(args[0]));
      };
      console.error = (...args: unknown[]) => {
        errorCalls.push(String(args[0]));
      };

      logger.info('only info');

      assertEquals(captured.length, 1);
      assertEquals(warnCalls.length, 0);
      assertEquals(errorCalls.length, 0);
    });

    it('debug() writes to console.debug, not other methods', () => {
      Deno.env.set('LOG_LEVEL', 'debug');
      _resetMinLevel();
      const infoCalls: string[] = [];
      const warnCalls: string[] = [];
      const errorCalls: string[] = [];
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.info = (...args: unknown[]) => {
        infoCalls.push(String(args[0]));
      };
      console.warn = (...args: unknown[]) => {
        warnCalls.push(String(args[0]));
      };
      console.error = (...args: unknown[]) => {
        errorCalls.push(String(args[0]));
      };

      logger.debug('only debug');

      assertEquals(captured.length, 1);
      assertEquals(infoCalls.length, 0);
      assertEquals(warnCalls.length, 0);
      assertEquals(errorCalls.length, 0);
    });
  });

  describe('log level filtering', () => {
    it('suppresses debug logs when LOG_LEVEL=info', () => {
      Deno.env.set('LOG_LEVEL', 'info');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('should be suppressed');

      assertEquals(captured.length, 0);
    });

    it('suppresses debug and info logs when LOG_LEVEL=warn', () => {
      Deno.env.set('LOG_LEVEL', 'warn');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('no');
      logger.info('no');
      logger.warn('yes');

      assertEquals(captured.length, 1);
    });

    it('only allows error logs when LOG_LEVEL=error', () => {
      Deno.env.set('LOG_LEVEL', 'error');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('no');
      logger.info('no');
      logger.warn('no');
      logger.error('yes');

      assertEquals(captured.length, 1);
    });

    it('defaults to info in production mode', () => {
      // DENO_DEPLOYMENT_ID is set (production mode), LOG_LEVEL not set
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('suppressed');
      logger.info('visible');

      assertEquals(captured.length, 1);
    });

    it('defaults to debug in dev mode', () => {
      Deno.env.delete('DENO_DEPLOYMENT_ID');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.debug('visible in dev');

      assertEquals(captured.length, 1);
    });
  });

  describe('dev-mode pretty printing', () => {
    it('outputs colored human-readable format when not deployed', () => {
      Deno.env.delete('DENO_DEPLOYMENT_ID');
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.info('server started', { port: 8000 });

      assertEquals(captured.length, 1);
      // Should contain level, message, and key=value pairs
      assertStringIncludes(captured[0], 'INFO');
      assertStringIncludes(captured[0], 'server started');
      assertStringIncludes(captured[0], 'port=8000');
    });

    it('uses HH:MM:SS time format', () => {
      Deno.env.delete('DENO_DEPLOYMENT_ID');
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.warn('test');

      assertEquals(captured.length, 1);
      // Strip ANSI codes and match [HH:MM:SS]
      // deno-lint-ignore no-control-regex
      const stripped = captured[0].replace(/\x1b\[\d+m/g, '');
      const timeMatch = stripped.match(/\[(\d{2}:\d{2}:\d{2})\]/);
      assertExists(timeMatch, 'should contain HH:MM:SS timestamp');
    });

    it('does not output JSON in dev mode', () => {
      Deno.env.delete('DENO_DEPLOYMENT_ID');
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      logger.info('hello');

      assertEquals(captured.length, 1);
      let isJson = false;
      try {
        JSON.parse(captured[0]);
        isJson = true;
      } catch {
        // expected
      }
      assertEquals(isJson, false, 'dev mode should not output JSON');
    });
  });

  describe('createRequestLogger()', () => {
    it('includes requestId in every log entry', () => {
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      const reqLogger = createRequestLogger('abc-123');
      reqLogger.info('request started');
      reqLogger.warn('slow response');

      assertEquals(captured.length, 2);
      const infoEntry = JSON.parse(captured[0]);
      const warnEntry = JSON.parse(captured[1]);
      assertEquals(infoEntry.requestId, 'abc-123');
      assertEquals(warnEntry.requestId, 'abc-123');
    });

    it('merges additional context with requestId', () => {
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      const reqLogger = createRequestLogger('req-456');
      reqLogger.info('handling request', { method: 'GET', path: '/api/hatches' });

      const entry = JSON.parse(captured[0]);
      assertEquals(entry.requestId, 'req-456');
      assertEquals(entry.method, 'GET');
      assertEquals(entry.path, '/api/hatches');
    });

    it('has all four log level methods', () => {
      Deno.env.set('LOG_LEVEL', 'debug');
      _resetMinLevel();
      console.debug = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.info = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.warn = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };
      console.error = (...args: unknown[]) => {
        captured.push(String(args[0]));
      };

      const reqLogger = createRequestLogger('req-789');
      reqLogger.debug('d');
      reqLogger.info('i');
      reqLogger.warn('w');
      reqLogger.error('e');

      assertEquals(captured.length, 4);
      for (const raw of captured) {
        const entry = JSON.parse(raw);
        assertEquals(entry.requestId, 'req-789');
      }
    });
  });
});
