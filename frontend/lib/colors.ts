/**
 * Shared color constants for fishing quality indicators
 *
 * These colors are used consistently across all components that display
 * fishing quality (TopPicks, StreamList, StreamConditionsCard, StationMap).
 */

export type FishingQuality = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Tailwind CSS classes for quality backgrounds and borders
 * Use in components with className/class
 */
export const qualityClasses: Record<FishingQuality, string> = {
  excellent: 'bg-green-100 border-green-500 text-green-800',
  good: 'bg-blue-100 border-blue-500 text-blue-800',
  fair: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  poor: 'bg-red-100 border-red-500 text-red-800',
};

/**
 * Tailwind CSS classes for quality badges/pills
 */
export const qualityBadgeClasses: Record<FishingQuality, string> = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-red-500',
};

/**
 * Hex colors for use in canvas/SVG/inline styles (e.g., Leaflet markers)
 */
export const qualityHexColors: Record<FishingQuality, string> = {
  excellent: '#22c55e', // green-500
  good: '#3b82f6', // blue-500
  fair: '#eab308', // yellow-500
  poor: '#ef4444', // red-500
};

/**
 * Human-readable labels with emojis
 */
export const qualityLabels: Record<FishingQuality, string> = {
  excellent: '🎯 Excellent',
  good: '👍 Good',
  fair: '⚠️ Fair',
  poor: '❌ Poor',
};

/**
 * Sort order for quality (best = lowest number)
 */
export const qualityOrder: Record<FishingQuality, number> = {
  excellent: 0,
  good: 1,
  fair: 2,
  poor: 3,
};

/**
 * Confidence level colors (for hatch predictions)
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export const confidenceClasses: Record<ConfidenceLevel, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-400',
};

/**
 * Display metadata for USGS parameter statuses
 *
 * Maps each ParameterStatus to user-facing text, tooltip, and Tailwind classes.
 * Used when a station value is null to explain *why* data is missing.
 */
export const parameterStatusDisplay: Record<
  string,
  { text: string; title: string; classes: string }
> = {
  available: { text: '', title: '', classes: '' },
  not_equipped: {
    text: 'N/A',
    title: 'Not monitored at this station',
    classes: 'text-slate-400',
  },
  sentinel: {
    text: 'Unavailable',
    title: 'Equipment issue or ice-affected reading',
    classes: 'text-amber-500',
  },
  no_data: {
    text: '—', // em dash
    title: 'Sensor equipped but no data received',
    classes: 'text-slate-400',
  },
};

/**
 * Display metadata for stream data completeness levels
 */
export const completenessDisplay: Record<string, { label: string; classes: string }> = {
  full: { label: 'Full data', classes: 'text-green-600 bg-green-50' },
  partial: { label: 'Partial data', classes: 'text-amber-600 bg-amber-50' },
  limited: { label: 'Limited data', classes: 'text-slate-500 bg-slate-100' },
};

/**
 * Default/loading state color
 */
export const defaultMarkerColor = '#64748b'; // slate-500
export const defaultBorderColor = '#475569'; // slate-600
