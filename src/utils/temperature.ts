/**
 * Shared temperature conversion utilities.
 *
 * Consolidates the three duplicate implementations that existed across
 * usgs.ts, weather.ts, and the predict routes.
 */

/** Convert Celsius to Fahrenheit, rounded to `precision` decimal places. */
export function celsiusToFahrenheit(celsius: number, precision = 1): number {
  if (precision < 0 || precision > 15) {
    throw new RangeError('Precision must be between 0 and 15');
  }
  const raw = celsius * 9 / 5 + 32;
  const factor = 10 ** precision;
  return Math.round(raw * factor) / factor;
}

/** Convert Fahrenheit to Celsius, rounded to `precision` decimal places. */
export function fahrenheitToCelsius(fahrenheit: number, precision = 1): number {
  if (precision < 0 || precision > 15) {
    throw new RangeError('Precision must be between 0 and 15');
  }
  const raw = (fahrenheit - 32) * 5 / 9;
  const factor = 10 ** precision;
  return Math.round(raw * factor) / factor;
}
