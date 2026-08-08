/**
 * Background texture ids — client-safe (just the type). Each is now tied 1:1
 * to a specific icon-layout arrangement (see ICON_LAYOUT_ARRANGEMENT_BACKGROUND
 * in app/api/og/route.tsx) rather than user-selectable, so there's no options
 * list or default export here anymore. The actual PNGs live in
 * public/backgrounds/ and are read server-side by
 * lib/design/og-backgrounds.server.ts, which app/page.tsx (a Client
 * Component) can't import directly.
 */

export type BackgroundId = 'none' | 'grid-background' | 'graph-paper' | 'concentric-circles'
