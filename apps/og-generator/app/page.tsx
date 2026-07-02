'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { Suggestion } from '@/lib/ai/suggest'
import { ICON_LIBRARY } from '@/lib/assets/icon-library'
import { type SeedIcon } from '@/lib/assets/seed-icons'
import { contrastRatio, rating } from '@/lib/design/contrast'
import { DEFAULT_TEMPLATE_ID, TEMPLATES } from '@/lib/design/templates'
import { color, typography } from '@/lib/design/tokens'

/**
 * Editor. State maps 1:1 to /api/og query params (the stateless recipe, §6.9).
 * "Both" renders the OG and Thumb together from two independent renders.
 */

const SOFT_LIMIT = 60
const HARD_LIMIT = 70
const MIN_SIZE = typography.roles.headline.minSize
const MAX_SIZE = typography.roles.headline.maxSize
const THUMB_MIN = 160
const THUMB_MAX = 480
const OPACITY_MIN = 0.2
const OPACITY_MAX = 0.35

const OUTER = { x: (64 / 1200) * 100, y: (64 / 630) * 100 }
const HEADLINE_INSET = { x: (80 / 1200) * 100, y: (72 / 630) * 100 }

type View = 'og' | 'thumb' | 'both'
type PatternTypeOpt = 'none' | 'dots' | 'grid' | 'hlines' | 'vlines'
type PatternScaleOpt = 'sm' | 'md' | 'lg'
type PatternColorOpt = 'white' | 'green'
/** Backgrounds are white-only for now — color picker removed from the UI. */
const PATTERN_COLOR: PatternColorOpt = 'white'
/** Collapse any legacy 'sm' value (still used by older examples) onto 'md'. */
const normalizeScale = (s: PatternScaleOpt): PatternScaleOpt => (s === 'sm' ? 'md' : s)
type EyebrowStyle = 'text' | 'pill'

const PATTERN_TYPE_OPTS: { value: PatternTypeOpt; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dot grid' },
  { value: 'grid', label: 'Square grid' },
  { value: 'hlines', label: 'Horizontal rules' },
  { value: 'vlines', label: 'Vertical rules' },
]
const SCALE_OPTS: { value: PatternScaleOpt; label: string }[] = [
  { value: 'md', label: 'Default' },
  { value: 'lg', label: 'Bigger' },
]
const VIEW_OPTS: { value: View; label: string }[] = [
  { value: 'og', label: 'OG' },
  { value: 'thumb', label: 'Thumb' },
  { value: 'both', label: 'Both' },
]
const EYEBROW_STYLE_OPTS: { value: EyebrowStyle; label: string }[] = [
  { value: 'text', label: 'Plain' },
  { value: 'pill', label: 'Pill' },
]

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

// Section header — deliberately dominant (bold, uppercase, dark, with a divider)
// so it reads clearly above the lighter option labels within each section.
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-default pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-foreground-light">{children}</span>
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
    <div className="inline-flex rounded-md border border-default bg-surface-100 p-0.5">
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

/** Debounced fetch of a render endpoint → object URL + fit metadata from headers. */
function useRenderedImage(endpoint: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  const [fit, setFit] = useState<FitInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const id = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
        const blob = await res.blob()
        if (cancelled) return
        const u = URL.createObjectURL(blob)
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
        prevUrl.current = u
        setUrl(u)
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
  }, [endpoint, enabled])

  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current) }, [])

  return { url, fit, loading, error }
}

function PreviewCard({
  label,
  imgUrl,
  loading,
  error,
  alt,
  showSafeArea,
  showHeadlineInset,
  showCrops,
  copied,
  onCopy,
  onDownload,
  children,
}: {
  label: string
  imgUrl: string | null
  loading: boolean
  error: string | null
  alt: string
  showSafeArea: boolean
  showHeadlineInset: boolean
  showCrops: boolean
  copied: boolean
  onCopy: () => void
  onDownload: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-light">
          {label}
          <span className="ml-2 font-normal text-foreground-lighter">
            1200 × 630{loading ? ' · rendering…' : ''}
          </span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="rounded-md border border-default bg-surface-100 px-2.5 py-1 text-xs text-foreground hover:border-strong"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button
            onClick={onDownload}
            disabled={!imgUrl}
            className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-background hover:bg-brand/90 disabled:opacity-50"
          >
            Download
          </button>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-lg border border-default bg-surface-100"
        style={{ aspectRatio: '1200 / 630' }}
      >
        {imgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={alt} className="h-full w-full" />
        )}
        {showSafeArea && (
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute border border-dashed border-brand/40"
              style={{ top: `${OUTER.y}%`, bottom: `${OUTER.y}%`, left: `${OUTER.x}%`, right: `${OUTER.x}%` }}
            />
            {showHeadlineInset && (
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

      {children}

      {showCrops && imgUrl && (
        <div className="mt-1">
          <p className="mb-2 text-[11px] text-foreground-lighter">
            Platform crops — how feeds crop &amp; round it
          </p>
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((pf) => (
              <div key={pf.name} className="flex flex-col gap-1">
                <div
                  className="relative overflow-hidden border border-default bg-surface-200"
                  style={{ width: 120, aspectRatio: pf.aspect, borderRadius: pf.radius }}
                >
                  {pf.accent && <div className="absolute left-0 top-0 z-10 h-full w-1 bg-brand" />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="text-[10px] text-foreground-lighter">{pf.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <pre className="overflow-x-auto rounded-md border border-destructive-400 bg-destructive-200 p-3 text-xs text-destructive-600">
          {error}
        </pre>
      )}
    </div>
  )
}

export default function Page() {
  const [view, setView] = useState<View>('both')
  const [aiDescription, setAiDescription] = useState('')
  const [headline, setHeadline] = useState('Postgres full text search just got faster')
  const [eyebrow, setEyebrow] = useState('Engineering')
  const [eyebrowStyle, setEyebrowStyle] = useState<EyebrowStyle>('text')
  const [sentenceCase, setSentenceCase] = useState(true)
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE_ID)
  const [autoFit, setAutoFit] = useState(true)
  const [manualFontSize, setManualFontSize] = useState(56)
  const [icon, setIcon] = useState<string | null>(null)
  const [uploadedIcons, setUploadedIcons] = useState<SeedIcon[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const allIcons = useMemo(() => [...ICON_LIBRARY, ...uploadedIcons], [uploadedIcons])

  // Load the shared asset library (uploaded icons); empty when Supabase is off.
  useEffect(() => {
    fetch('/api/assets')
      .then((r) => r.json())
      .then((d) => setUploadedIcons(d.assets ?? []))
      .catch(() => {})
  }, [])

  const uploadSvg = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/assets', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed')
        return
      }
      setUploadedIcons((prev) => [data.asset as SeedIcon, ...prev])
      setIcon((data.asset as SeedIcon).name)
    } catch {
      setUploadError('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Custom color logos (partnerships, acquisitions, co-marketing) — rendered
  // full-color, no stroke normalization. The browser measures natural pixel
  // size before upload so /api/og can fit it without distortion.
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    setLogoError(null)
    try {
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
          URL.revokeObjectURL(url)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Could not read the image — is it a valid SVG/PNG/JPEG/WebP?'))
        }
        img.src = url
      })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', 'logo')
      fd.append('width', String(width))
      fd.append('height', String(height))
      const res = await fetch('/api/assets', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setLogoError(data.error ?? 'Upload failed')
        return
      }
      setUploadedIcons((prev) => [data.asset as SeedIcon, ...prev])
      setIcon((data.asset as SeedIcon).name)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed — please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }
  const [thumbSize, setThumbSize] = useState(380)
  const [scale, setScale] = useState<1 | 2>(1)
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [showCrops, setShowCrops] = useState(false)

  const [patternType, setPatternType] = useState<PatternTypeOpt>(
    DEFAULT_TPL.defaultPattern.type as PatternTypeOpt
  )
  const [patternScale, setPatternScale] = useState<PatternScaleOpt>(
    normalizeScale(DEFAULT_TPL.defaultPattern.scale as PatternScaleOpt)
  )
  const patternColor = PATTERN_COLOR
  const [patternOpacity, setPatternOpacity] = useState(OPACITY_MIN)

  const [copied, setCopied] = useState<View | null>(null)

  const showOg = view !== 'thumb'
  const showThumb = view !== 'og'

  const patternParams = (p: URLSearchParams) => {
    p.set('pattern', patternType)
    if (patternType !== 'none') {
      p.set('patternScale', patternScale)
      p.set('patternColor', patternColor)
      p.set('patternOpacity', String(patternOpacity))
    }
  }

  const ogEndpoint = useMemo(() => {
    const p = new URLSearchParams()
    p.set('headline', headline)
    if (eyebrow.trim()) {
      p.set('eyebrow', eyebrow.trim())
      if (eyebrowStyle === 'pill') p.set('eyebrowStyle', 'pill')
    }
    if (!sentenceCase) p.set('sentenceCase', '0')
    p.set('template', template)
    if (!autoFit) p.set('fontSize', String(manualFontSize))
    if (icon) p.set('icon', icon)
    patternParams(p)
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headline, eyebrow, eyebrowStyle, sentenceCase, template, autoFit, manualFontSize, icon, scale, patternType, patternScale, patternColor, patternOpacity])

  const thumbEndpoint = useMemo(() => {
    const p = new URLSearchParams()
    p.set('type', 'thumb')
    if (icon) p.set('icon', icon)
    p.set('thumbSize', String(thumbSize))
    patternParams(p)
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icon, thumbSize, scale, patternType, patternScale, patternColor, patternOpacity])

  const og = useRenderedImage(ogEndpoint, showOg)
  const thumb = useRenderedImage(thumbEndpoint, showThumb)

  // Template and background are independent controls — switching templates
  // must not touch whatever pattern the user already has set. (AI suggestions
  // still set a pattern explicitly, right after calling this, when the
  // suggestion includes one — see applySuggestion below.)
  const changeTemplate = (id: string) => {
    setTemplate(id)
  }

  const [generated, setGenerated] = useState<Suggestion | null>(null)
  const [generating, setGenerating] = useState(false)
  const [exampleCopied, setExampleCopied] = useState(false)
  // Server route decides the engine: Claude when ANTHROPIC_API_KEY is set,
  // else the backend-free keyword matcher. Same Suggestion shape either way.
  const generate = async () => {
    const description = aiDescription.trim()
    if (!description) {
      setGenerated(null)
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      if (!res.ok) throw new Error(`suggest failed: ${res.status}`)
      setGenerated((await res.json()) as Suggestion)
    } catch (err) {
      console.error(err)
      setGenerated({
        iconName: null,
        templateId: template,
        rationale: 'Could not generate a suggestion — please try again.',
        source: 'none',
        alternates: [],
      })
    } finally {
      setGenerating(false)
    }
  }
  const applySuggestion = () => {
    if (!generated) return
    if (generated.iconName) setIcon(generated.iconName)
    changeTemplate(generated.templateId)
    if (generated.pattern) {
      setPatternType(generated.pattern.type as PatternTypeOpt)
      setPatternScale(normalizeScale(generated.pattern.scale as PatternScaleOpt))
      setPatternOpacity(Math.max(OPACITY_MIN, generated.pattern.opacity))
    }
    if (generated.eyebrow && !eyebrow.trim()) setEyebrow(generated.eyebrow)
  }

  // Backend-free way to grow the featured-examples corpus (§6.8): copy the
  // current composition as a ready-to-paste entry for lib/ai/examples.ts.
  const saveAsExample = () => {
    if (!icon) return
    const entry: Record<string, unknown> = {
      id: `ex-${Date.now().toString(36)}`,
      subject: (aiDescription.trim() || headline).toLowerCase(),
      iconName: icon,
      templateId: template,
    }
    if (eyebrow.trim()) entry.eyebrow = eyebrow.trim()
    if (patternType !== 'none') {
      entry.pattern = { type: patternType, scale: patternScale, color: patternColor, opacity: patternOpacity }
    }
    entry.whyItWorks = '<why this composition works>'
    navigator.clipboard.writeText(`${JSON.stringify(entry, null, 2)},`)
    setExampleCopied(true)
    setTimeout(() => setExampleCopied(false), 2500)
  }

  const count = [...headline].length
  const counterColor =
    count > HARD_LIMIT
      ? 'text-destructive-600'
      : count >= SOFT_LIMIT
        ? 'text-warning-600'
        : 'text-foreground-lighter'

  const headlineContrast = contrastRatio(color('text.primary'), color('bg.primary'))
  const headlineRating = rating(headlineContrast, true)

  const copyUrl = async (endpoint: string, key: View) => {
    const abs = typeof window !== 'undefined' ? window.location.origin + endpoint : endpoint
    await navigator.clipboard.writeText(abs)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const download = (url: string | null, name: string) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  const sliderValue = autoFit ? (og.fit?.fontSize ?? MAX_SIZE) : manualFontSize
  const suffix = scale === 2 ? '@2x' : ''

  return (
    <div className="relative h-screen overflow-hidden bg-background text-foreground">
      {/* Canvas — one continuous full-bleed dot-grid surface; the tool panel
          floats on top of it (absolutely positioned), not beside it. */}
      <main
        className="@container absolute inset-0 flex flex-col items-center overflow-auto p-8 pr-[380px]"
        style={{
          backgroundColor: '#f4f4f5',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* view toggle — stays pinned near the top */}
        <div className="mb-5 flex w-full items-center justify-center">
          <Segmented value={view} onChange={setView} options={VIEW_OPTS} />
        </div>

        {/* Fills the remaining canvas height; on wide/side-by-side screens the
            row centers within it. (flex-1 items don't shrink below their
            content, so this can't clip an overflowing row — it just grows.) */}
        <div className="flex w-full flex-1 flex-col items-center @4xl:justify-center">
          <div
            className={`flex flex-col gap-6 @4xl:flex-row @4xl:items-start ${
              view === 'both' ? 'w-full' : 'w-[65%]'
            }`}
          >
            {showOg && (
              <div className="min-w-0 @4xl:flex-1">
                <PreviewCard
                  label="OG"
                  imgUrl={og.url}
                  loading={og.loading}
                  error={og.error}
                  alt={headline}
                  showSafeArea={showSafeArea}
                  showHeadlineInset
                  showCrops={showCrops}
                  copied={copied === 'og'}
                  onCopy={() => copyUrl(ogEndpoint, 'og')}
                  onDownload={() => download(og.url, `og${suffix}.png`)}
                >
                  <div className="flex flex-col gap-2">
                    {og.fit && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-full border border-default bg-background px-3 py-1 text-xs text-foreground-light shadow-sm">
                        <span className="font-medium text-foreground">Headline:</span>
                        <span className="text-foreground">
                          {og.fit.fontSize}px{og.fit.mode === 'auto' ? ' (auto on)' : ''}
                        </span>
                        <span className="text-foreground-lighter">·</span>
                        <span>
                          {og.fit.lineCount} {og.fit.lineCount === 1 ? 'line' : 'lines'}
                        </span>
                        <span className="text-foreground-lighter">·</span>
                        <span className="font-medium text-foreground">WCAG:</span>
                        <span className={headlineRating === 'Fail' ? 'text-destructive-600' : 'text-brand'}>
                          {headlineContrast.toFixed(1)}:1 {headlineRating}
                        </span>
                      </div>
                    )}
                    {og.fit?.overflow && (
                      <p className="text-xs text-destructive-600">
                        ⚠ Won’t fit in 2 lines even at the minimum size — shorten it before export.
                      </p>
                    )}
                    {og.fit && !og.fit.overflow && og.fit.mode === 'manual' && og.fit.lineCount > 2 && (
                      <p className="text-xs text-warning-600">
                        ⚠ More than 2 lines — allowed in manual mode, but off-brand.
                      </p>
                    )}
                  </div>
                </PreviewCard>
              </div>
            )}

            {showThumb && (
              <div className="min-w-0 @4xl:flex-1">
                <PreviewCard
                  label="Thumb"
                  imgUrl={thumb.url}
                  loading={thumb.loading}
                  error={thumb.error}
                  alt="Thumbnail preview"
                  showSafeArea={showSafeArea}
                  showHeadlineInset={false}
                  showCrops={showCrops}
                  copied={copied === 'thumb'}
                  onCopy={() => copyUrl(thumbEndpoint, 'thumb')}
                  onDownload={() => download(thumb.url, `thumb${suffix}.png`)}
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-foreground-light">
                      No headline — the Thumb is icon-only and shares the OG’s icon (§3).
                    </p>
                    {!icon && (
                      <p className="text-xs text-warning-600">
                        ⚠ Pick an icon in Assets — the Thumb has no text to fall back on.
                      </p>
                    )}
                  </div>
                </PreviewCard>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating tool panel — packaged top bar + all controls, docked right.
          Absolutely positioned (not a flex sibling) so the canvas behind it
          is one continuous surface, not two boxes split by a shared edge. */}
      <aside className="absolute right-4 top-4 bottom-4 z-10 flex w-[340px] flex-col overflow-hidden rounded-xl border border-default bg-background shadow-lg">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-default px-5">
          <span className="text-sm font-medium text-foreground">OG Image Generator</span>
          <label className="flex items-center gap-1.5 text-xs text-foreground-light">
            <input
              type="checkbox"
              id="toggle-scale"
              checked={scale === 2}
              onChange={(e) => setScale(e.target.checked ? 2 : 1)}
            />
            Export @2x
          </label>
        </div>
        <div className="flex flex-col overflow-y-auto overflow-x-hidden p-5">
          {showOg && (
            <Group title="AI art direction">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground-light">
                  Describe this post
                  <Hint text="Picks an on-brand icon + template + background for your post. Uses Claude when an ANTHROPIC_API_KEY is set (see README) and falls back to a keyword match over the seed icons otherwise (§6.6)." />
                </span>
                <textarea
                  id="ai-describe"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={2}
                  className="resize-none rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                  placeholder="e.g. row-level security for multi-tenant apps"
                />
                <button
                  onClick={generate}
                  disabled={!aiDescription.trim() || generating}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-medium text-background hover:bg-brand/90 disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" />
                    <path d="M18.5 14.5l.85 2.65 2.65.85-2.65.85-.85 2.65-.85-2.65-2.65-.85 2.65-.85z" />
                  </svg>
                  {generating ? 'Generating…' : 'Generate'}
                </button>
                {generated && (
                  <div className="flex flex-col gap-2 rounded-md border border-default bg-surface-100 p-3">
                    {generated.iconName ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-default text-foreground-light">
                            {(() => {
                              const ic = allIcons.find((i) => i.name === generated.iconName)
                              return ic ? (
                                <svg
                                  width={20}
                                  height={20}
                                  viewBox={ic.viewBox}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  dangerouslySetInnerHTML={{ __html: ic.body }}
                                />
                              ) : null
                            })()}
                          </div>
                          <div className="min-w-0 flex-1 text-xs">
                            <div className="text-foreground">{generated.rationale}</div>
                            <div className="text-foreground-lighter">
                              {generated.source === 'ai'
                                ? '✨ AI suggestion'
                                : generated.source === 'example'
                                  ? '★ Featured example'
                                  : 'Icon library'}{' '}
                              ·{' '}
                              {TEMPLATES.find((t) => t.id === generated.templateId)?.label}
                            </div>
                          </div>
                          <button
                            onClick={applySuggestion}
                            className="shrink-0 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-background hover:bg-brand/90"
                          >
                            Apply
                          </button>
                        </div>
                        {generated.alternates.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-foreground-lighter">Also:</span>
                            {generated.alternates.map((a) => (
                              <button
                                key={a.iconName}
                                onClick={() => setIcon(a.iconName)}
                                className="rounded border border-default px-2 py-0.5 text-xs text-foreground-light hover:border-strong"
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-warning-600">{generated.rationale}</p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={saveAsExample}
                  disabled={!icon}
                  title={icon ? 'Copy this composition as a featured example' : 'Pick an icon first'}
                  className="self-start rounded-md border border-default px-2.5 py-1 text-xs text-foreground-light hover:border-strong disabled:opacity-50"
                >
                  {exampleCopied ? '✓ Copied — paste into lib/ai/examples.ts' : '★ Save current as example'}
                </button>
              </div>
            </Group>
          )}

          {showOg && (
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
            </Group>
          )}

          <Group title="Assets">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">
                Icon
                <Hint text="Line-art icons only, stroke locked to the illustration weight (§4). The icon is shared between the OG and Thumb." />
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
                {allIcons.map((ic) => (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    title={ic.kind === 'logo' ? `${ic.label} (color logo)` : ic.label}
                    className={`flex h-14 items-center justify-center rounded-md border p-1.5 ${
                      icon === ic.name
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-default bg-surface-100 text-foreground-light hover:border-strong'
                    }`}
                  >
                    {ic.kind === 'logo' && ic.url ? (
                      // Real colors, no forced stroke — this is the point of a logo.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ic.url} alt={ic.label} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <svg
                        width={22}
                        height={22}
                        viewBox={ic.viewBox}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dangerouslySetInnerHTML={{ __html: ic.body }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                    uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'
                  }`}
                >
                  {uploading ? 'Uploading…' : '+ Upload SVG icon'}
                  <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadSvg(f)
                      e.target.value = ''
                    }}
                  />
                </label>
                <label
                  className={`rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                    uploadingLogo ? 'cursor-wait opacity-70' : 'cursor-pointer'
                  }`}
                >
                  {uploadingLogo ? 'Uploading…' : '+ Upload logo (color)'}
                  <input
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadLogo(f)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              {uploadError && <p className="text-xs text-warning-600">{uploadError}</p>}
              {logoError && <p className="text-xs text-warning-600">{logoError}</p>}
              <p className="text-xs text-foreground-lighter">
                Line-art SVGs become shared icons, re-drawn with the locked stroke. Logos (SVG, PNG,
                JPEG, or WebP) keep their original colors — for partnerships, acquisitions, and
                co-marketing. Both are stored in Supabase and need the secret key configured.
              </p>
            </div>
          </Group>

          {showOg && (
            <Group title="Content">
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
                <div className="flex items-center justify-between">
                  <Label>Style</Label>
                  <Segmented value={eyebrowStyle} onChange={setEyebrowStyle} options={EYEBROW_STYLE_OPTS} />
                </div>
              </div>

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

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground-light">
                    Font size
                    <Hint text="Auto-fit picks the largest size that keeps the headline to 2 lines — the highest-leverage guardrail for legibility at thumbnail size." />
                  </span>
                  <span className="text-xs tabular-nums text-foreground-lighter">
                    {autoFit ? `Auto · ${og.fit?.fontSize ?? '—'}px` : `${manualFontSize}px`}
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
                      if (!on) setManualFontSize(og.fit?.fontSize ?? manualFontSize)
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
                  className="w-full min-w-0 accent-brand disabled:opacity-40"
                />

                <label className="flex items-center gap-2 text-sm text-foreground-light">
                  <input
                    type="checkbox"
                    id="toggle-sentence-case"
                    checked={!sentenceCase}
                    onChange={(e) => setSentenceCase(!e.target.checked)}
                  />
                  Disable sentence-case
                  <Hint text="By default headlines are sentence-cased, with brand terms (Postgres, pgvector, API…) preserved automatically. Check this to type it exactly as written." />
                </label>
              </div>
            </Group>
          )}

          {showThumb && (
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
                  className="w-full min-w-0 accent-brand"
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
                <Hint text="Subtle white background texture. Opacity is locked to a range (20–35%) that keeps it a texture, not foreground (§6.7)." />
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
                  <Label>Scale</Label>
                  <Segmented value={patternScale} onChange={setPatternScale} options={SCALE_OPTS} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label>Opacity</Label>
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
                    className="w-full min-w-0 accent-brand"
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
        </div>
      </aside>
    </div>
  )
}
