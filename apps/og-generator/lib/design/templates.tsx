import type { CSSProperties, ReactElement, ReactNode } from 'react'

import type { PatternColor, PatternScale, PatternType } from '@/lib/design/patterns'

/**
 * Multi-template registry (brief §5.6). Each template is a guardrailed layout
 * that already satisfies the safe area + alignment rules — the user picks one
 * and customizes copy/icon within it, rather than building from a blank canvas.
 *
 * Templates are data: id, the headline text-box width the auto-fit measures
 * against, intrinsic text alignment, a default background pattern (§6.7), and a
 * `build` that arranges the pre-rendered pieces into the satori root. This shape
 * maps onto the future `templates` table's og_schema_json (§8).
 */

export interface TemplateDefaultPattern {
  type: PatternType | 'none'
  scale: PatternScale
  color: PatternColor
  opacity: number
}

export interface TemplateParts {
  W: number
  H: number
  padX: number
  padY: number
  bg: string
  scaleFactor: number
  textBlock: ReactNode
  iconEl: ReactNode | null
  patternLayer: ReactNode | null
  hasIcon: boolean
}

export interface Template {
  id: string
  label: string
  /** Headline text-box width (1x px) the auto-fit measures against. */
  headlineBox: number
  textAlign: 'left' | 'center'
  defaultPattern: TemplateDefaultPattern
  build: (p: TemplateParts) => ReactElement
}

const FULL_BOX = 1200 - 80 * 2 // 1040 — headline inset both sides

function rootBase(p: TemplateParts): CSSProperties {
  return {
    position: 'relative',
    width: p.W,
    height: p.H,
    display: 'flex',
    padding: `${p.padY}px ${p.padX}px`,
    backgroundColor: p.bg,
    fontFamily: 'Manrope',
  }
}

export const TEMPLATES: Template[] = [
  {
    id: 'bottom-left',
    label: 'Headline bottom-left',
    headlineBox: FULL_BOX,
    textAlign: 'left',
    defaultPattern: { type: 'dots', scale: 'md', color: 'white', opacity: 0.06 },
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: p.hasIcon ? 'space-between' : 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        {p.patternLayer}
        {p.hasIcon ? (
          <div style={{ display: 'flex', width: p.W - p.padX * 2, justifyContent: 'flex-end' }}>
            {p.iconEl}
          </div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'split-right',
    label: 'Headline left, icon right',
    headlineBox: 1200 - 80 * 2 - 220 - 56, // 764 — leaves room for the icon column
    textAlign: 'left',
    defaultPattern: { type: 'grid', scale: 'md', color: 'white', opacity: 0.05 },
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 56 * p.scaleFactor,
        }}
      >
        {p.patternLayer}
        {p.textBlock}
        {p.iconEl}
      </div>
    ),
  },
  {
    id: 'centered',
    label: 'Centered',
    headlineBox: 900,
    textAlign: 'center',
    defaultPattern: { type: 'dots', scale: 'lg', color: 'green', opacity: 0.05 },
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {p.patternLayer}
        {p.hasIcon ? (
          <div style={{ display: 'flex', marginBottom: 36 * p.scaleFactor }}>{p.iconEl}</div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'stacked',
    label: 'Headline top, icon bottom',
    headlineBox: FULL_BOX,
    textAlign: 'left',
    defaultPattern: { type: 'hlines', scale: 'md', color: 'white', opacity: 0.06 },
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {p.patternLayer}
        {p.textBlock}
        {p.iconEl}
      </div>
    ),
  },
]

export const TEMPLATE_MAP: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
)

export const DEFAULT_TEMPLATE_ID = 'bottom-left'
