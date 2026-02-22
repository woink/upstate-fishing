import { cn } from '@shared/lib/cn.ts';

type IconElement =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number };

const ICON_DATA: Record<string, IconElement[]> = {
  'fish': [
    {
      type: 'path',
      d: 'M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z',
    },
    { type: 'path', d: 'M18 12v.5' },
    { type: 'path', d: 'M16 17.93a9.77 9.77 0 0 1 0-11.86' },
    {
      type: 'path',
      d: 'M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33',
    },
    { type: 'path', d: 'M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4' },
    { type: 'path', d: 'm16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98' },
  ],
  'droplets': [
    {
      type: 'path',
      d: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z',
    },
    {
      type: 'path',
      d: 'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97',
    },
  ],
  'thermometer': [
    { type: 'path', d: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z' },
  ],
  'waves': [
    {
      type: 'path',
      d: 'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    },
    {
      type: 'path',
      d: 'M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    },
    {
      type: 'path',
      d: 'M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    },
  ],
  'star': [
    {
      type: 'path',
      d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
    },
  ],
  'refresh-cw': [
    { type: 'path', d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' },
    { type: 'path', d: 'M21 3v5h-5' },
    { type: 'path', d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' },
    { type: 'path', d: 'M8 16H3v5' },
  ],
  'cloud-sun': [
    { type: 'path', d: 'M12 2v2' },
    { type: 'path', d: 'm4.93 4.93 1.41 1.41' },
    { type: 'path', d: 'M20 12h2' },
    { type: 'path', d: 'm19.07 4.93-1.41 1.41' },
    { type: 'path', d: 'M15.947 12.65a4 4 0 0 0-5.925-4.128' },
    { type: 'path', d: 'M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z' },
  ],
  'sun': [
    { type: 'circle', cx: 12, cy: 12, r: 4 },
    { type: 'path', d: 'M12 2v2' },
    { type: 'path', d: 'M12 20v2' },
    { type: 'path', d: 'm4.93 4.93 1.41 1.41' },
    { type: 'path', d: 'm17.66 17.66 1.41 1.41' },
    { type: 'path', d: 'M2 12h2' },
    { type: 'path', d: 'M20 12h2' },
    { type: 'path', d: 'm6.34 17.66-1.41 1.41' },
    { type: 'path', d: 'm19.07 4.93-1.41 1.41' },
  ],
  'sunrise': [
    { type: 'path', d: 'M12 2v8' },
    { type: 'path', d: 'm4.93 10.93 1.41 1.41' },
    { type: 'path', d: 'M2 18h2' },
    { type: 'path', d: 'M20 18h2' },
    { type: 'path', d: 'm19.07 10.93-1.41 1.41' },
    { type: 'path', d: 'M22 22H2' },
    { type: 'path', d: 'm8 6 4-4 4 4' },
    { type: 'path', d: 'M16 18a4 4 0 0 0-8 0' },
  ],
  'sunset': [
    { type: 'path', d: 'M12 10V2' },
    { type: 'path', d: 'm4.93 10.93 1.41 1.41' },
    { type: 'path', d: 'M2 18h2' },
    { type: 'path', d: 'M20 18h2' },
    { type: 'path', d: 'm19.07 10.93-1.41 1.41' },
    { type: 'path', d: 'M22 22H2' },
    { type: 'path', d: 'm16 6-4 4-4-4' },
    { type: 'path', d: 'M16 18a4 4 0 0 0-8 0' },
  ],
  'clock': [
    { type: 'circle', cx: 12, cy: 12, r: 10 },
    { type: 'path', d: 'M12 6v6l4 2' },
  ],
  'map-pin': [
    {
      type: 'path',
      d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
    },
    { type: 'circle', cx: 12, cy: 10, r: 3 },
  ],
  'bug': [
    { type: 'path', d: 'M12 20v-9' },
    { type: 'path', d: 'M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z' },
    { type: 'path', d: 'M14.12 3.88 16 2' },
    { type: 'path', d: 'M21 21a4 4 0 0 0-3.81-4' },
    { type: 'path', d: 'M21 5a4 4 0 0 1-3.55 3.97' },
    { type: 'path', d: 'M22 13h-4' },
    { type: 'path', d: 'M3 21a4 4 0 0 1 3.81-4' },
    { type: 'path', d: 'M3 5a4 4 0 0 0 3.55 3.97' },
    { type: 'path', d: 'M6 13H2' },
    { type: 'path', d: 'm8 2 1.88 1.88' },
    { type: 'path', d: 'M9 7.13V6a3 3 0 1 1 6 0v1.13' },
  ],
  'alert-triangle': [
    { type: 'path', d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' },
    { type: 'path', d: 'M12 9v4' },
    { type: 'path', d: 'M12 17h.01' },
  ],
  'x-circle': [
    { type: 'circle', cx: 12, cy: 12, r: 10 },
    { type: 'path', d: 'm15 9-6 6' },
    { type: 'path', d: 'm9 9 6 6' },
  ],
  'thumbs-up': [
    {
      type: 'path',
      d: 'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z',
    },
    { type: 'path', d: 'M7 10v12' },
  ],
  'target': [
    { type: 'circle', cx: 12, cy: 12, r: 10 },
    { type: 'circle', cx: 12, cy: 12, r: 6 },
    { type: 'circle', cx: 12, cy: 12, r: 2 },
  ],
  'cloud': [
    { type: 'path', d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' },
  ],
  'search': [
    { type: 'circle', cx: 11, cy: 11, r: 8 },
    { type: 'path', d: 'm21 21-4.34-4.34' },
  ],
};

export type IconName = keyof typeof ICON_DATA;

export const ICON_NAMES = Object.keys(ICON_DATA) as IconName[];

const SIZE_MAP = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof SIZE_MAP;

interface IconProps {
  name: IconName;
  size?: IconSize;
  class?: string;
  'aria-label'?: string;
}

export function Icon({
  name,
  size = 'md',
  class: className,
  'aria-label': ariaLabel,
}: IconProps) {
  const elements = ICON_DATA[name];
  const px = SIZE_MAP[size];

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={px}
      height={px}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      stroke-width='2'
      stroke-linecap='round'
      stroke-linejoin='round'
      class={cn('inline-block shrink-0', className)}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : 'true'}
    >
      {elements.map((el, i) =>
        el.type === 'circle'
          ? <circle key={i} cx={el.cx} cy={el.cy} r={el.r} />
          : <path key={i} d={el.d} />
      )}
    </svg>
  );
}
