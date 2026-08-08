/**
 * Seed line-art icons (Lucide-derived, MIT) — a small bundled set so the icon
 * rendering + stroke-normalization system can be built and proven WITHOUT the
 * Supabase asset library yet. Later these become rows in the `assets` table /
 * `og-assets` Storage bucket; the renderer keeps consuming the same shape, so
 * the storage swap is non-destructive.
 *
 * Each icon is authored on a 24-unit viewBox with stroke (no fill), `tags` for
 * the future AI art-direction search (§6.6).
 */
export interface SeedIcon {
  name: string
  label: string
  tags: string[]
  /** Square viewBox, e.g. "0 0 24 24". */
  viewBox: string
  /** Inner SVG markup — strokes use currentColor, fill none. */
  body: string
  /**
   * Asset kind. Seed/Lucide icons and uploaded line icons are 'icon' (the
   * default when omitted) — rendered stroke-only via lib/design/icons.ts.
   * Custom color logos (partnerships, acquisitions) are 'logo' — rendered
   * full-color, fit to their natural aspect ratio, no stroke normalization.
   */
  kind?: 'icon' | 'logo'
  /** Public URL for a logo stored in Supabase Storage (kind: 'logo'). */
  url?: string
  /** Natural pixel dimensions, client-measured at upload (kind: 'logo'). */
  width?: number
  height?: number
}

// Bundled brand-mark logo — NOT brand-scoped (unlike uploaded logo assets),
// so it's always available for Partner logos/Announcement's default
// regardless of the active brand or that brand's uploaded asset list.
// Data URI of apps/www/public/images/supabase-logo-icon.svg (viewBox 0 0 109 113).
const SUPABASE_BOLT_DATA_URI =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDkiIGhlaWdodD0iMTEzIiBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMTA5IDExMyI+PHBhdGggZmlsbD0idXJsKCNhKSIgZD0iTTYzLjcwOCAxMTAuMjg0Yy0yLjg2IDMuNjAxLTguNjU4IDEuNjI4LTguNzI3LTIuOTdsLTEuMDA3LTY3LjI1MWg0NS4yMmM4LjE5IDAgMTIuNzU4IDkuNDYgNy42NjUgMTUuODc0eiIvPjxwYXRoIGZpbGw9InVybCgjYikiIGZpbGwtb3BhY2l0eT0iLjIiIGQ9Ik02My43MDggMTEwLjI4NGMtMi44NiAzLjYwMS04LjY1OCAxLjYyOC04LjcyNy0yLjk3bC0xLjAwNy02Ny4yNTFoNDUuMjJjOC4xOSAwIDEyLjc1OCA5LjQ2IDcuNjY1IDE1Ljg3NHoiLz48cGF0aCBmaWxsPSIjM2VjZjhlIiBkPSJNNDUuMzE3IDIuMDcxYzIuODYtMy42MDEgOC42NTctMS42MjggOC43MjYgMi45N2wuNDQyIDY3LjI1MUg5LjgzYy04LjE5IDAtMTIuNzU5LTkuNDYtNy42NjUtMTUuODc1eiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDE9IjUzLjk3NCIgeDI9Ijk0LjE2MyIgeTE9IjU0Ljk3NCIgeTI9IjcxLjgyOSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIHN0b3AtY29sb3I9IiMyNDkzNjEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMzZWNmOGUiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9IjM2LjE1NiIgeDI9IjU0LjQ4NCIgeTE9IjMwLjU3OCIgeTI9IjY1LjA4MSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg=='

export const SEED_ICONS: SeedIcon[] = [
  {
    name: 'supabase-bolt',
    label: 'Supabase bolt',
    tags: ['supabase', 'bolt', 'brand'],
    viewBox: '0 0 109 113',
    body: '',
    kind: 'logo',
    url: SUPABASE_BOLT_DATA_URI,
    width: 109,
    height: 113,
  },
  {
    name: 'database',
    label: 'Database',
    tags: ['database', 'storage', 'postgres', 'data', 'sql', 'pgvector', 'vector', 'search'],
    viewBox: '0 0 24 24',
    body: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  },
  {
    name: 'lock',
    label: 'Lock',
    tags: ['security', 'auth', 'rls', 'private', 'access'],
    viewBox: '0 0 24 24',
    body: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  },
  {
    name: 'layers',
    label: 'Layers',
    tags: ['stack', 'layers', 'multi-tenant', 'infrastructure'],
    viewBox: '0 0 24 24',
    body: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  },
  {
    name: 'zap',
    label: 'Realtime',
    tags: ['realtime', 'fast', 'speed', 'bolt', 'edge', 'live'],
    viewBox: '0 0 24 24',
    body: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  },
  {
    name: 'globe',
    label: 'Globe',
    tags: ['network', 'edge', 'global', 'web', 'api', 'cdn'],
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  },
]

export const SEED_ICON_MAP: Record<string, SeedIcon> = Object.fromEntries(
  SEED_ICONS.map((icon) => [icon.name, icon])
)
