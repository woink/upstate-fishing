import { assertEquals } from '@std/assert';
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
