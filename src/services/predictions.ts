/**
 * Hatch Prediction Service
 * Combines water temp, weather, and time of year to predict active hatches
 */

import type {
  Hatch,
  HatchPrediction,
  StationData,
  StreamConditions,
  WeatherConditions,
} from '../models/types.ts';
import type { Stream } from '../models/types.ts';
import { HATCHES } from '../data/hatches.ts';

// ============================================================================
// Prediction Configuration
// ============================================================================

interface PredictionConfig {
  /** Weight for temperature match (0-1) */
  tempWeight: number;
  /** Weight for time of year match (0-1) */
  monthWeight: number;
  /** Weight for weather conditions (0-1) */
  weatherWeight: number;
  /** Minimum probability to include in results */
  minProbability: number;
}

const DEFAULT_CONFIG: PredictionConfig = {
  tempWeight: 0.5,
  monthWeight: 0.3,
  weatherWeight: 0.2,
  minProbability: 0.2,
};

// ============================================================================
// Prediction Service
// ============================================================================

export class PredictionService {
  private readonly config: PredictionConfig;

  constructor(config: Partial<PredictionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Predict which hatches are likely occurring on a stream
   */
  predictHatches(
    stationData: StationData[],
    weather: WeatherConditions | null,
    date: Date = new Date(),
  ): HatchPrediction[] {
    // Get average water temp from stations
    const waterTempF = this.getAverageWaterTemp(stationData);
    if (waterTempF === null) {
      // No temp data, fall back to month-based predictions only
      return this.predictByMonthOnly(date);
    }

    const month = date.getMonth() + 1; // 1-12
    const hour = date.getHours();
    const isOvercast = weather ? weather.cloudCoverPercent >= 70 : false;
    const isPrecip = weather ? weather.precipProbability >= 40 : false;

    const predictions: HatchPrediction[] = [];

    for (const hatch of HATCHES) {
      const tempScore = this.scoreTempMatch(waterTempF, hatch);
      const monthScore = this.scoreMonthMatch(month, hatch);
      const weatherScore = this.scoreWeatherMatch(isOvercast, isPrecip, hatch);
      const timeScore = this.scoreTimeOfDay(hour, hatch);

      // Combined probability
      const rawProbability =
        tempScore * this.config.tempWeight +
        monthScore * this.config.monthWeight +
        weatherScore * this.config.weatherWeight;

      // Apply time of day modifier
      const probability = rawProbability * timeScore;

      if (probability >= this.config.minProbability) {
        predictions.push({
          hatch,
          probability: Math.round(probability * 100) / 100,
          confidence: this.getConfidence(tempScore, monthScore),
          reasoning: this.buildReasoning(hatch, waterTempF, month, isOvercast, hour),
        });
      }
    }

    // Sort by probability descending
    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Generate stream conditions summary
   */
  generateConditions(
    stream: Stream,
    stationData: StationData[],
    weather: WeatherConditions | null,
    date: Date = new Date(),
  ): StreamConditions {
    const predictedHatches = this.predictHatches(stationData, weather, date);
    const waterTempF = this.getAverageWaterTemp(stationData);

    return {
      stream,
      timestamp: date.toISOString(),
      stationData,
      weather: weather ?? undefined,
      predictedHatches,
      fishingQuality: this.assessFishingQuality(waterTempF, predictedHatches, weather),
      summary: this.buildSummary(stream, waterTempF, predictedHatches, weather),
    };
  }

  /**
   * Get average water temperature from station data
   */
  private getAverageWaterTemp(stationData: StationData[]): number | null {
    const temps = stationData
      .map((s) => s.waterTempF)
      .filter((t): t is number => t !== null);

    if (temps.length === 0) return null;
    return temps.reduce((sum, t) => sum + t, 0) / temps.length;
  }

  /**
   * Score how well current temp matches hatch's preferred range
   */
  private scoreTempMatch(tempF: number, hatch: Hatch): number {
    if (tempF < hatch.minTempF - 5 || tempF > hatch.maxTempF + 5) {
      return 0; // Too far outside range
    }

    if (tempF >= hatch.minTempF && tempF <= hatch.maxTempF) {
      // Inside optimal range - score based on how centered
      const range = hatch.maxTempF - hatch.minTempF;
      const midpoint = hatch.minTempF + range / 2;
      const distFromMid = Math.abs(tempF - midpoint);
      return 1 - distFromMid / (range / 2) * 0.3; // 0.7-1.0
    }

    // Just outside range, partial score
    if (tempF < hatch.minTempF) {
      return Math.max(0, 1 - (hatch.minTempF - tempF) / 5) * 0.5;
    } else {
      return Math.max(0, 1 - (tempF - hatch.maxTempF) / 5) * 0.5;
    }
  }

  /**
   * Score how well current month matches hatch's peak months
   */
  private scoreMonthMatch(month: number, hatch: Hatch): number {
    if (hatch.peakMonths.includes(month)) {
      return 1.0;
    }

    // Check adjacent months
    const prevMonth = month === 1 ? 12 : month - 1;
    const nextMonth = month === 12 ? 1 : month + 1;

    if (hatch.peakMonths.includes(prevMonth) || hatch.peakMonths.includes(nextMonth)) {
      return 0.5;
    }

    return 0;
  }

  /**
   * Score weather conditions for hatch preference
   */
  private scoreWeatherMatch(isOvercast: boolean, isPrecip: boolean, hatch: Hatch): number {
    if (hatch.prefersOvercast) {
      if (isOvercast || isPrecip) return 1.0;
      return 0.5; // Can still hatch, just not optimal
    }

    // Most hatches don't specifically prefer overcast
    return 0.8;
  }

  /**
   * Score time of day match
   */
  private scoreTimeOfDay(hour: number, hatch: Hatch): number {
    switch (hatch.timeOfDay) {
      case 'any':
        return 1.0;
      case 'morning':
        return hour >= 6 && hour <= 11 ? 1.0 : 0.5;
      case 'midday':
        return hour >= 10 && hour <= 14 ? 1.0 : 0.5;
      case 'afternoon':
        return hour >= 13 && hour <= 17 ? 1.0 : 0.5;
      case 'evening':
        return hour >= 16 && hour <= 21 ? 1.0 : 0.5;
      default:
        return 0.8;
    }
  }

  /**
   * Determine confidence level based on scores
   */
  private getConfidence(tempScore: number, monthScore: number): 'low' | 'medium' | 'high' {
    const combined = (tempScore + monthScore) / 2;
    if (combined >= 0.8) return 'high';
    if (combined >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Build human-readable reasoning for prediction
   */
  private buildReasoning(
    hatch: Hatch,
    waterTempF: number,
    month: number,
    isOvercast: boolean,
    _hour: number,
  ): string {
    const parts: string[] = [];

    // Temperature reasoning
    if (waterTempF >= hatch.minTempF && waterTempF <= hatch.maxTempF) {
      parts.push(`Water temp (${waterTempF}°F) is in optimal range (${hatch.minTempF}-${hatch.maxTempF}°F)`);
    } else {
      parts.push(`Water temp (${waterTempF}°F) is near range (${hatch.minTempF}-${hatch.maxTempF}°F)`);
    }

    // Month reasoning
    if (hatch.peakMonths.includes(month)) {
      parts.push('Currently in peak season');
    }

    // Weather reasoning
    if (hatch.prefersOvercast && isOvercast) {
      parts.push('Overcast conditions favor this hatch');
    }

    return parts.join('. ') + '.';
  }

  /**
   * Fall back to month-only predictions when no temp data
   */
  private predictByMonthOnly(date: Date): HatchPrediction[] {
    const month = date.getMonth() + 1;

    return HATCHES
      .filter((h) => h.peakMonths.includes(month))
      .map((hatch) => ({
        hatch,
        probability: 0.5,
        confidence: 'low' as const,
        reasoning: 'Based on typical seasonal timing. No water temperature data available.',
      }))
      .sort((a, b) => b.probability - a.probability);
  }

  /**
   * Assess overall fishing quality
   */
  private assessFishingQuality(
    waterTempF: number | null,
    predictions: HatchPrediction[],
    weather: WeatherConditions | null,
  ): 'poor' | 'fair' | 'good' | 'excellent' {
    // Too hot or too cold
    if (waterTempF !== null) {
      if (waterTempF > 68) return 'poor'; // Stress temp for trout
      if (waterTempF < 38) return 'poor'; // Too cold for activity
    }

    // High wind is bad
    if (weather && weather.windSpeedMph > 20) {
      return 'fair';
    }

    // Score based on predictions
    const topPredictions = predictions.filter((p) => p.probability >= 0.5);

    if (topPredictions.length >= 3) return 'excellent';
    if (topPredictions.length >= 2) return 'good';
    if (topPredictions.length >= 1) return 'fair';

    return 'poor';
  }

  /**
   * Build summary text
   */
  private buildSummary(
    stream: Stream,
    waterTempF: number | null,
    predictions: HatchPrediction[],
    weather: WeatherConditions | null,
  ): string {
    const parts: string[] = [];

    parts.push(`${stream.name}`);

    if (waterTempF !== null) {
      parts.push(`Water: ${waterTempF}°F`);
    }

    if (weather) {
      parts.push(`Air: ${weather.airTempF}°F, ${weather.shortForecast}`);
    }

    if (predictions.length > 0) {
      const topHatches = predictions.slice(0, 3).map((p) => p.hatch.commonName);
      parts.push(`Likely hatches: ${topHatches.join(', ')}`);
    } else {
      parts.push('No significant hatches expected');
    }

    return parts.join(' | ');
  }
}

// Default singleton instance
export const predictionService = new PredictionService();
