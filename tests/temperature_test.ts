import { assertEquals, assertThrows } from '@std/assert';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '@shared/utils/temperature.ts';

// ============================================================================
// celsiusToFahrenheit
// ============================================================================

Deno.test('celsiusToFahrenheit - freezing point', () => {
  assertEquals(celsiusToFahrenheit(0), 32);
});

Deno.test('celsiusToFahrenheit - boiling point', () => {
  assertEquals(celsiusToFahrenheit(100), 212);
});

Deno.test('celsiusToFahrenheit - typical trout stream temp (12°C)', () => {
  assertEquals(celsiusToFahrenheit(12), 53.6);
});

Deno.test('celsiusToFahrenheit - default precision is 1 decimal', () => {
  // 15°C = 59°F exactly
  assertEquals(celsiusToFahrenheit(15), 59);
  // 22.5°C = 72.5°F exactly
  assertEquals(celsiusToFahrenheit(22.5), 72.5);
});

Deno.test('celsiusToFahrenheit - precision=0 rounds to integer', () => {
  assertEquals(celsiusToFahrenheit(12, 0), 54);
  assertEquals(celsiusToFahrenheit(22.5, 0), 73);
});

Deno.test('celsiusToFahrenheit - precision=2 for extra detail', () => {
  // 12.345°C = 54.221°F
  assertEquals(celsiusToFahrenheit(12.345, 2), 54.22);
});

// ============================================================================
// fahrenheitToCelsius
// ============================================================================

Deno.test('fahrenheitToCelsius - freezing point', () => {
  assertEquals(fahrenheitToCelsius(32), 0);
});

Deno.test('fahrenheitToCelsius - boiling point', () => {
  assertEquals(fahrenheitToCelsius(212), 100);
});

Deno.test('fahrenheitToCelsius - typical fishing temp (54°F)', () => {
  assertEquals(fahrenheitToCelsius(54), 12.2);
});

Deno.test('fahrenheitToCelsius - 50°F = 10°C', () => {
  assertEquals(fahrenheitToCelsius(50), 10);
});

Deno.test('fahrenheitToCelsius - precision=0 rounds to integer', () => {
  assertEquals(fahrenheitToCelsius(54, 0), 12);
});

Deno.test('fahrenheitToCelsius - precision=2', () => {
  assertEquals(fahrenheitToCelsius(54, 2), 12.22);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test('celsiusToFahrenheit - negative temperatures', () => {
  // -40 is the crossover point where both scales converge
  assertEquals(celsiusToFahrenheit(-40), -40);
  assertEquals(celsiusToFahrenheit(-17.8, 1), 0);
});

Deno.test('fahrenheitToCelsius - negative temperatures', () => {
  assertEquals(fahrenheitToCelsius(-40), -40);
  assertEquals(fahrenheitToCelsius(0), -17.8);
});

Deno.test('celsiusToFahrenheit - special values', () => {
  assertEquals(celsiusToFahrenheit(NaN), NaN);
  assertEquals(celsiusToFahrenheit(Infinity), Infinity);
  assertEquals(celsiusToFahrenheit(-Infinity), -Infinity);
});

Deno.test('fahrenheitToCelsius - special values', () => {
  assertEquals(fahrenheitToCelsius(NaN), NaN);
  assertEquals(fahrenheitToCelsius(Infinity), Infinity);
  assertEquals(fahrenheitToCelsius(-Infinity), -Infinity);
});

// ============================================================================
// Precision Validation
// ============================================================================

Deno.test('celsiusToFahrenheit - throws on negative precision', () => {
  assertThrows(() => celsiusToFahrenheit(10, -1), RangeError, 'Precision must be between 0 and 15');
});

Deno.test('celsiusToFahrenheit - throws on precision > 15', () => {
  assertThrows(() => celsiusToFahrenheit(10, 16), RangeError, 'Precision must be between 0 and 15');
});

Deno.test('fahrenheitToCelsius - throws on negative precision', () => {
  assertThrows(() => fahrenheitToCelsius(50, -1), RangeError, 'Precision must be between 0 and 15');
});

Deno.test('fahrenheitToCelsius - throws on precision > 15', () => {
  assertThrows(() => fahrenheitToCelsius(50, 16), RangeError, 'Precision must be between 0 and 15');
});

Deno.test('precision boundary values work correctly', () => {
  // precision=0 and precision=15 should not throw
  assertEquals(celsiusToFahrenheit(100, 0), 212);
  assertEquals(typeof celsiusToFahrenheit(100, 15), 'number');
  assertEquals(fahrenheitToCelsius(212, 0), 100);
  assertEquals(typeof fahrenheitToCelsius(212, 15), 'number');
});
