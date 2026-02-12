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
 * Default/loading state color
 */
export const defaultMarkerColor = '#64748b'; // slate-500
export const defaultBorderColor = '#475569'; // slate-600
