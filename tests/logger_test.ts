/**
 * Logger utility tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, describe, it } from '@std/testing/bdd';
import { logger } from '@shared/utils/logger.ts';

describe('logger', () => {
  let captured: string[] = [];
  const originalWarn = console.warn;
  const originalError = console.error;

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
    captured = [];
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
  });
});
