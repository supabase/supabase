'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { SEED_ICONS } from '@/lib/assets/seed-icons'
import { contrastRatio, rating } from '@/lib/design/contrast'
import { DEFAULT_TEMPLATE_ID, TEMPLATES } from '@/lib/design/templates'
import { color, typography } from '@/lib/design/tokens'

/**
 * Editor (Phases 2–5). State maps 1:1 to /api/og query params — the stateless
 * layout recipe (§6.9). The asset library and team auth are later phases.
 */

const SOFT_LIMIT = 60
const HARD_LIMIT = 70
const MIN_SIZE = typography.roles.headline.minSize
const MAX_SIZE = typography.roles.headline.maxSize
const THUMB_MIN = 160
const THUMB_MAX = 480
const OPACITY_MIN = 0.04
const OPACITY_MAX = 0.12

// Safe-area insets as % of the canvas, for the editor-only overlay (§3, §5.4).
const OUTER = { x: (64 / 1200) * 100, y: (64 / 630) * 100 }
const HEADLINE_INSET = { x: (80 / 1200) * 100, y: (72 / 630) * 100 }

type ImageType = 'og' | 'thumb'
type PatternTypeOpt = 'none' | 'dots' | 'grid' | 'hlines' | 'vlines'
type PatternScaleOpt = 'sm' | 'md' | 'lg'
type PatternColorOpt = 'white' | 'green'

const PATTERN_TYPE_OPTS: { value: PatternTypeOpt; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dot grid' },
  { value: 'grid', label: 'Square grid' },
  { value: 'hlines', label: 'Horizontal rules' },
  { value: 'vlines', label: 'Vertical rules' },
]
const SCALE_OPTS: { value: PatternScaleOpt; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
]
const COLOR_OPTS: { value: PatternColorOpt; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'green', label: 'Green' },
]

// Simulated platform unfurl frames (brief §11.1). The 1:1 "Messages" frame
// center-crops the 1.91:1 image, showing why edge content is risky.
const PLATFORMS: { name: string; aspect: string; radius: number; accent?: boolean }[] = [
  { name: 'X / Twitter', aspect: '1.91 / 1', radius: 16 },
  { name: 'LinkedIn', aspect: '1.91 / 1', radius: 4 },
  { name: 'Facebook', aspect: '1.91 / 1', radius: 2 },
  { name: 'Slack', aspect: '1.91 / 1', radius: 8, accent: true },
  { name: 'Messages', aspect: '1 / 1', radius: 18 },
]

const DEFAULT_TPL = TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) ?? TEMPLATES[0]

interface FitInfo {
  fontSize: number
  lineCount: number
  fits: boolean
  overflow: boolean
  mode: string
  widest: number
}

function Hint({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="ml-1 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-default align-middle text-[9px] leading-none text-foreground-lighter"
    >
      ?
    </span>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-lighter">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-default p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded px-2.5 py-1 text-xs ${
            value === o.value
              ? 'bg-surface-300 text-foreground'
              : 'text-foreground-light hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Page() {
  const [imageType, setImageType] = useState<ImageType>('og')
  const [headline, setHeadline] = useState('Postgres full text search just got faster')
  const [eyebrow, setEyebrow] = useState('Engineering')
  const [sentenceCase, setSentenceCase] = useState(true)
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE_ID)
  const [autoFit, setAutoFit] = useState(true)
  const [manualFontSize, setManualFontSize] = useState(56)
  const [icon, setIcon] = useState<string | null>(null)
  const [thumbSize, setThumbSize] = useState(380)
  const [scale, setScale] = useState<1 | 2>(1)
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [showCrops, setShowCrops] = useState(false)

  const [patternType, setPatternType] = useState<PatternTypeOpt>(
    DEFAULT_TPL.defaultPattern.type as PatternTypeOpt
  )
  const [patternScale, setPatternScale] = useState<PatternScaleOpt>(
    DEFAULT_TPL.defaultPattern.scale as PatternScaleOpt
  )
  const [patternColor, setPatternColor] = useState<PatternColorOpt>(
    DEFAULT_TPL.defaultPattern.color as PatternColorOpt
  )
  const [patternOpacity, setPatternOpacity] = useState(DEFAULT_TPL.defaultPattern.opacity)

  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [fit, setFit] = useState<FitInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const prevUrlRef = useRef<string | null>(null)

  // Switching template resets the pattern to that template's curated default.
  const changeTemplate = (id: string) => {
    setTemplate(id)
    const t = TEMPLATES.find((x) => x.id === id)
    if (t) {
      setPatternType(t.defaultPattern.type as PatternTypeOpt)
      setPatternScale(t.defaultPattern.scale as PatternScaleOpt)
      setPatternColor(t.defaultPattern.color as PatternColorOpt)
      setPatternOpacity(t.defaultPattern.opacity)
    }
  }

  const endpoint = useMemo(() => {
    const p = new URLSearchParams()
    const addPattern = () => {
      p.set('pattern', patternType)
      if (patternType !== 'none') {
        p.set('patternScale', patternScale)
        p.set('patternColor', patternColor)
        p.set('patternOpacity', String(patternOpacity))
      }
    }
    if (imageType === 'thumb') {
      p.set('type', 'thumb')
      if (icon) p.set('icon', icon)
      p.set('thumbSize', String(thumbSize))
      addPattern()
      if (scale === 2) p.set('scale', '2')
      return `/api/og?${p.toString()}`
    }
    p.set('headline', headline)
    if (eyebrow.trim()) p.set('eyebrow', eyebrow.trim())
    if (!sentenceCase) p.set('sentenceCase', '0')
    p.set('template', template)
    if (!autoFit) p.set('fontSize', String(manualFontSize))
    if (icon) p.set('icon', icon)
    addPattern()
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
  }, [
    imageType,
    thumbSize,
    headline,
    eyebrow,
    sentenceCase,
    template,
    autoFit,
    manualFontSize,
    scale,
    icon,
    patternType,
    patternScale,
    patternColor,
    patternOpacity,
  ])

  useEffect(() => {
    let cancelled = false
    const id = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
        const blob = await res.blob()
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = url
        setImgUrl(url)
        setFit({
          fontSize: Number(res.headers.get('x-og-font-size')),
          lineCount: Number(res.headers.get('x-og-line-count')),
          fits: res.headers.get('x-og-fits') === 'true',
          overflow: res.headers.get('x-og-overflow') === 'true',
          mode: res.headers.get('x-og-mode') ?? 'auto',
          widest: Number(res.headers.get('x-og-widest-line-px')),
        })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to render')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [endpoint])

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [])

  const count = [...headline].length
  // Headline is large text (≥40px) → large-text WCAG thresholds; eyebrow (22px) → normal.
  const headlineContrast = contrastRatio(color('text.primary'), color('bg.primary'))
  const headlineRating = rating(headlineContrast, true)
  const eyebrowContrast = contrastRatio(color('brand.default'), color('bg.primary'))
  const counterColor =
    count > HARD_LIMIT
      ? 'text-destructive-600'
      : count >= SOFT_LIMIT
        ? 'text-warning-600'
        : 'text-foreground-lighter'

  const copyUrl = async () => {
    const abs = typeof window !== 'undefined' ? window.location.origin + endpoint : endpoint
    await navigator.clipboard.writeText(abs)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    if (!imgUrl) return
    const a = document.createElement('a')
    a.href = imgUrl
    a.download = `${imageType}${scale === 2 ? '@2x' : ''}.png`
    a.click()
  }

  const sliderValue = autoFit ? (fit?.fontSize ?? MAX_SIZE) : manualFontSize
  const isThumb = imageType === 'thumb'

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-default px-5">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">OG Image Generator</span>
          <Segmented
            value={imageType}
            onChange={(v) => setImageType(v)}
            options={[
              { value: 'og', label: 'OG' },
              { value: 'thumb', label: 'Thumb' },
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-foreground-light">
            <input
              type="checkbox"
              id="toggle-scale"
              checked={scale === 2}
              onChange={(e) => setScale(e.target.checked ? 2 : 1)}
            />
            Export @2x
          </label>
          <button
            onClick={copyUrl}
            className="rounded-md border border-default bg-surface-100 px-3 py-1.5 text-xs text-foreground hover:border-strong"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button
            onClick={download}
            disabled={!imgUrl}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-background hover:bg-brand/90 disabled:opacity-50"
          >
            Download PNG
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-[340px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-default p-5">
          {!isThumb && (
            <>
              <Group title="Content">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="headline" className="text-sm font-medium text-foreground-light">
                      Headline
                    </label>
                    <span className={`text-xs tabular-nums ${counterColor}`}>
                      {count} / {HARD_LIMIT}
                    </span>
                  </div>
                  <textarea
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    rows={3}
                    className="resize-none rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                    placeholder="Type a blog headline…"
                  />
                  <p className="text-xs text-foreground-lighter">
                    Press Enter for a manual line break (power-user mode). Otherwise it auto-fits.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="eyebrow" className="text-sm font-medium text-foreground-light">
                    Eyebrow <span className="text-foreground-lighter">(optional)</span>
                  </label>
                  <input
                    id="eyebrow"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    className="rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                    placeholder="e.g. Launch Week, Engineering"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground-light">
                  <input
                    type="checkbox"
                    id="toggle-sentence-case"
                    checked={sentenceCase}
                    onChange={(e) => setSentenceCase(e.target.checked)}
                  />
                  Auto sentence-case
                  <Hint text="Headlines are sentence case, with brand terms (Postgres, pgvector, API…) preserved automatically." />
                </label>
              </Group>

              <Group title="Layout">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground-light">
                    Template
                    <Hint text="Prebuilt layouts that already satisfy the safe area + alignment rules (§5.6). Pick one, then customize within it." />
                  </span>
                  <select
                    id="template"
                    value={template}
                    onChange={(e) => changeTemplate(e.target.value)}
                    className="rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                  >
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground-light">
                      Font size
                      <Hint text="Auto-fit picks the largest size that keeps the headline to 2 lines — the highest-leverage guardrail for legibility at thumbnail size." />
                    </span>
                    <span className="text-xs tabular-nums text-foreground-lighter">
                      {autoFit ? `Auto · ${fit?.fontSize ?? '—'}px` : `${manualFontSize}px`}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-foreground-light">
                    <input
                      type="checkbox"
                      id="toggle-autofit"
                      checked={autoFit}
                      onChange={(e) => {
                        const on = e.target.checked
                        setAutoFit(on)
                        if (!on) setManualFontSize(fit?.fontSize ?? manualFontSize)
                      }}
                    />
                    Auto-fit
                  </label>
                  <input
                    type="range"
                    id="font-size"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    step={2}
                    value={sliderValue}
                    disabled={autoFit}
                    onChange={(e) => setManualFontSize(Number(e.target.value))}
                    className="w-full accent-brand disabled:opacity-40"
                  />
                </div>
              </Group>
            </>
          )}

          <Group title="Assets">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">
                Icon
                <Hint text="Line-art icons only, stroke locked to 1.22–1.88px (§4). The icon is shared between the OG and Thumb." />
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setIcon(null)}
                  title="No icon"
                  className={`flex h-14 items-center justify-center rounded-md border text-xs ${
                    icon === null
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-default bg-surface-100 text-foreground-lighter hover:border-strong'
                  }`}
                >
                  None
                </button>
                {SEED_ICONS.map((ic) => (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    title={ic.label}
                    className={`flex h-14 items-center justify-center rounded-md border ${
                      icon === ic.name
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-default bg-surface-100 text-foreground-light hover:border-strong'
                    }`}
                  >
                    <svg
                      width={22}
                      height={22}
                      viewBox={ic.viewBox}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: ic.body }}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-foreground-lighter">
                {isThumb ? 'Shared with the OG image.' : 'Optional — appears per the chosen template.'}
              </p>
            </div>
          </Group>

          {isThumb && (
            <Group title="Thumb">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground-light">
                    Icon size
                    <Hint text="The Thumb has no text, so the icon scales up to fill the frame. Adjust it independently of the OG." />
                  </span>
                  <span className="text-xs tabular-nums text-foreground-lighter">{thumbSize}px</span>
                </div>
                <input
                  type="range"
                  id="thumb-size"
                  min={THUMB_MIN}
                  max={THUMB_MAX}
                  step={20}
                  value={thumbSize}
                  onChange={(e) => setThumbSize(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <p className="text-xs text-foreground-lighter">
                  No text by design — the Thumb shares the OG’s icon (§3).
                </p>
              </div>
            </Group>
          )}

          <Group title="Background">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">
                Pattern
                <Hint text="Subtle background texture. Opacity is locked low (4–12%) so it can never threaten headline contrast (§6.7)." />
              </span>
              <select
                id="pattern"
                value={patternType}
                onChange={(e) => setPatternType(e.target.value as PatternTypeOpt)}
                className="rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
              >
                {PATTERN_TYPE_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {patternType !== 'none' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-light">Scale</span>
                  <Segmented value={patternScale} onChange={setPatternScale} options={SCALE_OPTS} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-light">Color</span>
                  <Segmented value={patternColor} onChange={setPatternColor} options={COLOR_OPTS} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-light">Opacity</span>
                    <span className="text-xs tabular-nums text-foreground-lighter">
                      {Math.round(patternOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    id="pattern-opacity"
                    min={OPACITY_MIN}
                    max={OPACITY_MAX}
                    step={0.01}
                    value={patternOpacity}
                    onChange={(e) => setPatternOpacity(Number(e.target.value))}
                    className="w-full accent-brand"
                  />
                </div>
              </>
            )}
          </Group>

          <Group title="View">
            <label className="flex items-center gap-2 text-sm text-foreground-light">
              <input
                type="checkbox"
                id="toggle-safe-area"
                checked={showSafeArea}
                onChange={(e) => setShowSafeArea(e.target.checked)}
              />
              Show safe-area guide
              <Hint text="Dashed guides for the safe zone — editor-only, never part of the export." />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground-light">
              <input
                type="checkbox"
                id="toggle-crops"
                checked={showCrops}
                onChange={(e) => setShowCrops(e.target.checked)}
              />
              Show platform crops
              <Hint text="Preview how X, LinkedIn, Facebook, Slack and chat apps crop & round the 1200×630 (§11.1)." />
            </label>
          </Group>
        </aside>

        {/* Canvas */}
        <main className="flex min-w-0 flex-1 items-center justify-center overflow-auto p-8">
          <div className="w-full max-w-3xl">
            <div className="mb-2 flex items-center justify-between text-xs text-foreground-lighter">
              <span>{isThumb ? 'Thumb preview' : 'OG preview'}</span>
              <span>1200 × 630{loading ? ' · rendering…' : ''}</span>
            </div>

            <div
              className="relative w-full overflow-hidden rounded-lg border border-default"
              style={{ aspectRatio: '1200 / 630' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imgUrl && (
                <img src={imgUrl} alt={isThumb ? 'Thumbnail preview' : headline} className="h-full w-full" />
              )}

              {showSafeArea && (
                <div className="pointer-events-none absolute inset-0">
                  <div
                    className="absolute border border-dashed border-brand/40"
                    style={{
                      top: `${OUTER.y}%`,
                      bottom: `${OUTER.y}%`,
                      left: `${OUTER.x}%`,
                      right: `${OUTER.x}%`,
                    }}
                  />
                  {!isThumb && (
                    <div
                      className="absolute border border-dashed border-warning/50"
                      style={{
                        top: `${HEADLINE_INSET.y}%`,
                        bottom: `${HEADLINE_INSET.y}%`,
                        left: `${HEADLINE_INSET.x}%`,
                        right: `${HEADLINE_INSET.x}%`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Status + guardrail warnings */}
            <div className="mt-3 flex flex-col gap-2">
              {isThumb ? (
                <>
                  <p className="text-xs text-foreground-light">
                    No headline — the Thumb is icon-only and shares the OG’s icon (§3).
                  </p>
                  {!icon && (
                    <p className="text-xs text-warning-600">
                      ⚠ Pick an icon in Assets — the Thumb has no text to fall back on.
                    </p>
                  )}
                </>
              ) : (
                <>
                  {fit && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-light">
                      <span>
                        Font size: <span className="text-foreground">{fit.fontSize}px</span>
                      </span>
                      <span>
                        Lines: <span className="text-foreground">{fit.lineCount}</span>
                      </span>
                      <span>
                        Mode: <span className="text-foreground">{fit.mode}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-light">
                    <span>
                      Headline contrast:{' '}
                      <span className={headlineRating === 'Fail' ? 'text-destructive-600' : 'text-brand'}>
                        {headlineContrast.toFixed(1)}:1 · {headlineRating}
                      </span>
                    </span>
                    {eyebrow.trim() && (
                      <span>
                        Eyebrow:{' '}
                        <span className="text-foreground">{eyebrowContrast.toFixed(1)}:1</span>
                      </span>
                    )}
                  </div>
                  {headlineRating === 'Fail' && (
                    <p className="text-xs text-destructive-600">
                      ⚠ Headline contrast is below WCAG AA — adjust before export (§5.3).
                    </p>
                  )}
                  {fit?.overflow && (
                    <p className="text-xs text-destructive-600">
                      ⚠ This headline won’t fit in 2 lines even at the minimum size. Shorten it
                      before exporting.
                    </p>
                  )}
                  {fit && !fit.overflow && fit.mode === 'manual' && fit.lineCount > 2 && (
                    <p className="text-xs text-warning-600">
                      ⚠ More than 2 lines — allowed in manual mode, but off-brand.
                    </p>
                  )}
                </>
              )}
              {error && (
                <pre className="overflow-x-auto rounded-md border border-destructive-400 bg-destructive-200 p-3 text-xs text-destructive-600">
                  {error}
                </pre>
              )}
            </div>

            {showCrops && imgUrl && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-foreground-lighter">
                  Platform crops — how feeds crop &amp; round the 1200 × 630
                </p>
                <div className="flex flex-wrap gap-4">
                  {PLATFORMS.map((pf) => (
                    <div key={pf.name} className="flex flex-col gap-1">
                      <div
                        className="relative overflow-hidden border border-default bg-surface-100"
                        style={{ width: 150, aspectRatio: pf.aspect, borderRadius: pf.radius }}
                      >
                        {pf.accent && (
                          <div className="absolute left-0 top-0 z-10 h-full w-1 bg-brand" />
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-[10px] text-foreground-lighter">{pf.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
