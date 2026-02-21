import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals, assertMatch } from '@std/assert';
import tailwindConfig from '../../../tailwind.config.ts';
import {
  completenessDisplay,
  confidenceClasses,
  type ConfidenceLevel,
  defaultBorderColor,
  defaultMarkerColor,
  type FishingQuality,
  parameterStatusDisplay,
  qualityBadgeClasses,
  qualityClasses,
  qualityHexColors,
  qualityLabels,
  qualityOrder,
} from '@shared/lib/colors.ts';

describe('Design Token System', () => {
  describe('Tailwind config references CSS custom properties', () => {
    const colors = tailwindConfig.theme.extend.colors;

    it('has semantic border/input/ring tokens referencing CSS vars', () => {
      assertEquals(colors.border, 'hsl(var(--border))');
      assertEquals(colors.input, 'hsl(var(--input))');
      assertEquals(colors.ring, 'hsl(var(--ring))');
    });

    it('has background/foreground tokens referencing CSS vars', () => {
      assertEquals(colors.background, 'hsl(var(--background))');
      assertEquals(colors.foreground, 'hsl(var(--foreground))');
    });

    it('has primary color with DEFAULT and foreground', () => {
      assert(typeof colors.primary === 'object' && colors.primary !== null);
      const primary = colors.primary as { DEFAULT: string; foreground: string };
      assertEquals(primary.DEFAULT, 'hsl(var(--primary))');
      assertEquals(primary.foreground, 'hsl(var(--primary-foreground))');
    });

    it('has secondary color with DEFAULT and foreground', () => {
      assert(typeof colors.secondary === 'object' && colors.secondary !== null);
      const secondary = colors.secondary as { DEFAULT: string; foreground: string };
      assertEquals(secondary.DEFAULT, 'hsl(var(--secondary))');
      assertEquals(secondary.foreground, 'hsl(var(--secondary-foreground))');
    });

    it('has destructive color with DEFAULT and foreground', () => {
      assert(typeof colors.destructive === 'object' && colors.destructive !== null);
      const destructive = colors.destructive as { DEFAULT: string; foreground: string };
      assertEquals(destructive.DEFAULT, 'hsl(var(--destructive))');
      assertEquals(destructive.foreground, 'hsl(var(--destructive-foreground))');
    });

    it('has muted color with DEFAULT and foreground', () => {
      assert(typeof colors.muted === 'object' && colors.muted !== null);
      const muted = colors.muted as { DEFAULT: string; foreground: string };
      assertEquals(muted.DEFAULT, 'hsl(var(--muted))');
      assertEquals(muted.foreground, 'hsl(var(--muted-foreground))');
    });

    it('has accent color with DEFAULT and foreground', () => {
      assert(typeof colors.accent === 'object' && colors.accent !== null);
      const accent = colors.accent as { DEFAULT: string; foreground: string };
      assertEquals(accent.DEFAULT, 'hsl(var(--accent))');
      assertEquals(accent.foreground, 'hsl(var(--accent-foreground))');
    });

    it('has popover color with DEFAULT and foreground', () => {
      assert(typeof colors.popover === 'object' && colors.popover !== null);
      const popover = colors.popover as { DEFAULT: string; foreground: string };
      assertEquals(popover.DEFAULT, 'hsl(var(--popover))');
      assertEquals(popover.foreground, 'hsl(var(--popover-foreground))');
    });

    it('has card color with DEFAULT and foreground', () => {
      assert(typeof colors.card === 'object' && colors.card !== null);
      const card = colors.card as { DEFAULT: string; foreground: string };
      assertEquals(card.DEFAULT, 'hsl(var(--card))');
      assertEquals(card.foreground, 'hsl(var(--card-foreground))');
    });

    it('has quality tokens referencing CSS vars', () => {
      assert(typeof colors.quality === 'object' && colors.quality !== null);
      const quality = colors.quality as Record<string, string>;
      assertEquals(quality.excellent, 'hsl(var(--quality-excellent))');
      assertEquals(quality.good, 'hsl(var(--quality-good))');
      assertEquals(quality.fair, 'hsl(var(--quality-fair))');
      assertEquals(quality.poor, 'hsl(var(--quality-poor))');
    });

    it('preserves existing stream palette', () => {
      assert(typeof colors.stream === 'object' && colors.stream !== null);
      const stream = colors.stream as Record<string, string>;
      assertEquals(stream['500'], '#0ea5e9');
    });

    it('preserves existing forest palette', () => {
      assert(typeof colors.forest === 'object' && colors.forest !== null);
      const forest = colors.forest as Record<string, string>;
      assertEquals(forest['500'], '#22c55e');
    });

    it('has border radius tokens using CSS vars', () => {
      const borderRadius = tailwindConfig.theme.extend.borderRadius;
      assert(borderRadius !== undefined);
      assertEquals(borderRadius.lg, 'var(--radius)');
      assertEquals(borderRadius.md, 'calc(var(--radius) - 2px)');
      assertEquals(borderRadius.sm, 'calc(var(--radius) - 4px)');
    });
  });

  describe('colors.ts exports', () => {
    it('exports FishingQuality type values in qualityClasses', () => {
      const keys: FishingQuality[] = ['excellent', 'good', 'fair', 'poor'];
      for (const key of keys) {
        assert(key in qualityClasses, `qualityClasses missing key: ${key}`);
        assert(typeof qualityClasses[key] === 'string');
      }
    });

    it('exports qualityBadgeClasses for all quality levels', () => {
      const keys: FishingQuality[] = ['excellent', 'good', 'fair', 'poor'];
      for (const key of keys) {
        assert(key in qualityBadgeClasses, `qualityBadgeClasses missing key: ${key}`);
      }
    });

    it('exports qualityHexColors as hex strings', () => {
      const keys: FishingQuality[] = ['excellent', 'good', 'fair', 'poor'];
      for (const key of keys) {
        assertMatch(qualityHexColors[key], /^#[0-9a-f]{6}$/i);
      }
    });

    it('exports qualityLabels without emojis', () => {
      assertEquals(qualityLabels.excellent, 'Excellent');
      assertEquals(qualityLabels.good, 'Good');
      assertEquals(qualityLabels.fair, 'Fair');
      assertEquals(qualityLabels.poor, 'Poor');
    });

    it('exports qualityOrder with correct sort values', () => {
      assertEquals(qualityOrder.excellent, 0);
      assertEquals(qualityOrder.good, 1);
      assertEquals(qualityOrder.fair, 2);
      assertEquals(qualityOrder.poor, 3);
    });

    it('exports confidenceClasses for all levels', () => {
      const keys: ConfidenceLevel[] = ['high', 'medium', 'low'];
      for (const key of keys) {
        assert(key in confidenceClasses, `confidenceClasses missing key: ${key}`);
      }
    });

    it('exports parameterStatusDisplay with expected statuses', () => {
      for (const key of ['available', 'not_equipped', 'sentinel', 'no_data']) {
        assert(key in parameterStatusDisplay, `parameterStatusDisplay missing key: ${key}`);
        const entry = parameterStatusDisplay[key];
        assert('text' in entry);
        assert('title' in entry);
        assert('classes' in entry);
      }
    });

    it('exports completenessDisplay with expected levels', () => {
      for (const key of ['full', 'partial', 'limited']) {
        assert(key in completenessDisplay, `completenessDisplay missing key: ${key}`);
        const entry = completenessDisplay[key];
        assert('label' in entry);
        assert('classes' in entry);
      }
    });

    it('exports default marker and border colors as hex', () => {
      assertMatch(defaultMarkerColor, /^#[0-9a-f]{6}$/i);
      assertMatch(defaultBorderColor, /^#[0-9a-f]{6}$/i);
    });
  });
});
