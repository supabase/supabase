'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { ICON_LIBRARY } from '@/lib/assets/icon-library'
import { type SeedIcon } from '@/lib/assets/seed-icons'
import { BRAND_OPTIONS, DEFAULT_BRAND_ID, type BrandId } from '@/lib/design/brands'
import { DEFAULT_FORMAT_ID, FORMAT_OPTIONS, getFormat, type FormatId } from '@/lib/design/formats'
import {
  DEFAULT_NEWSLETTER_TEMPLATE_ID,
  DEFAULT_TEMPLATE_ID,
  INSTAGRAM_TEMPLATE_ID,
  NEWSLETTER_TEMPLATES,
  TEMPLATE_MAP,
  TEMPLATES,
} from '@/lib/design/templates'
import { IN_CONTEXT_OPTS, InContextPreview, type InContextMode } from './InContextPreview'

/**
 * Editor. State maps 1:1 to /api/og query params (the stateless recipe, §6.9).
 * "Both" renders the OG and Thumb together from two independent renders.
 */

const SOFT_LIMIT = 40
const HARD_LIMIT = 50
const EYEBROW_LIMIT = 20

/** Truncate to a max grapheme count — matches the `[...s].length` counters below. */
function clampChars(value: string, limit: number) {
  const chars = [...value]
  return chars.length > limit ? chars.slice(0, limit).join('') : value
}

/** Picks a random icon/logo name for a freshly-added logo-grid tile, so the
 * render updates immediately instead of sitting on an empty "Pick" slot. */
function randomIconName(icons: SeedIcon[]): string | null {
  if (!icons.length) return null
  return icons[Math.floor(Math.random() * icons.length)].name
}

/** Matches a search query against an icon's name, label, and tags. */
function matchesIconQuery(ic: SeedIcon, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    ic.name.toLowerCase().includes(q) ||
    ic.label.toLowerCase().includes(q) ||
    ic.tags.some((t) => t.toLowerCase().includes(q))
  )
}

// Color logos are usually authored for the dark OG canvas (white/light
// marks) — a light picker swatch makes them invisible, so logo swatches
// always get a fixed dark backdrop regardless of the app's own theme.
const LOGO_SWATCH_BG = 'bg-[#171717]'

// `isFileBacked`: a stored file (color logo, or a raster PNG icon) — both
// render as-is and are expected to be white/light marks against the dark
// canvas, so both get the fixed dark swatch backdrop, not just "logo" kind.
function pickerSwatchClass(selected: boolean, isFileBacked: boolean): string {
  const border = selected ? 'border-brand' : 'border-default hover:border-strong'
  if (isFileBacked) return `${border} ${LOGO_SWATCH_BG}`
  return `${border} ${selected ? 'bg-brand/10 text-brand' : 'bg-surface-100 text-foreground-light'}`
}

type View = 'og' | 'thumb' | 'both'

interface FitInfo {
  fontSize: number
  lineCount: number
  fits: boolean
  overflow: boolean
  mode: string
  widest: number
}

function Hint({ text }: { text: string }) {
  // Custom hover tooltip instead of the native `title` attribute — browser
  // tooltips have an inconsistent show delay (and don't reliably appear at
  // all in some setups), so this guarantees the hint is actually visible.
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-default text-[9px] leading-none text-foreground-lighter">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 w-max max-w-[200px] rounded-md border border-default bg-background px-2 py-1.5 text-[11px] font-normal normal-case leading-snug text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}

// Section header — uppercase with a divider for structure, but intentionally
// faint (not aiming for AA contrast) so it recedes behind the option labels
// within each section rather than competing with them.
function Group({
  title,
  children,
  noDivider,
}: {
  title: string
  children: React.ReactNode
  noDivider?: boolean
}) {
  return (
    <section
      className={`flex flex-col gap-3 pt-5 first:pt-0 ${
        noDivider ? '' : 'border-t border-default first:border-t-0'
      }`}
    >
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-lighter">{title}</h2>
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
  options: { value: T; label: string; disabled?: boolean; title?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-default bg-surface-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => !o.disabled && onChange(o.value)}
          disabled={o.disabled}
          title={o.title}
          className={`rounded px-2.5 py-1 text-xs ${
            o.disabled
              ? 'cursor-not-allowed text-foreground-lighter opacity-50'
              : value === o.value
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

/** Small illustrative diagram of where the headline/icon sit for a template. */
function LayoutThumb({ id }: { id: string }) {
  const iconBox = <div className="absolute h-3 w-3 rounded-sm bg-surface-300" />
  // Not `absolute` — it's always nested inside an already-positioned wrapper,
  // and stacking two position:absolute boxes with no offsets on this one left
  // its width ambiguous, overflowing the card for the items-end case.
  const bars = (align: 'items-start' | 'items-center' | 'items-end') => (
    <div className={`flex flex-col gap-0.5 ${align}`}>
      <div className="h-1 w-6 rounded-full bg-foreground-lighter" />
      <div className="h-1 w-4 rounded-full bg-foreground-lighter" />
    </div>
  )
  switch (id) {
    case 'social-instagram':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1/2 top-1.5 -translate-x-1/2">{iconBox}</div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">{bars('items-center')}</div>
        </div>
      )
    case 'newsletter-section':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2">{iconBox}</div>
          <div className="absolute left-6 top-1/2 h-1 w-6 -translate-y-1/2 rounded-full bg-foreground-lighter" />
        </div>
      )
    case 'logo-layout':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1.5 h-1.5 w-4 rounded-sm bg-surface-300" />
          <div className="absolute bottom-1.5 left-1.5">{bars('items-start')}</div>
        </div>
      )
    case 'logo-grid':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1.5 flex gap-0.5">
            <div className="h-2 w-2 rounded-[2px] bg-surface-300" />
            <div className="h-2 w-2 rounded-[2px] bg-surface-300" />
          </div>
          <div className="absolute bottom-1.5 left-1.5">{bars('items-start')}</div>
        </div>
      )
    case 'announcement':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1.5">{bars('items-start')}</div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">{iconBox}</div>
        </div>
      )
    case 'newsletter-cover':
    case 'social-twitter':
    case 'icon-layout':
    default:
      return (
        <div className="relative h-full w-full">
          <div className="absolute right-1.5 top-1.5">{iconBox}</div>
          <div className="absolute bottom-1.5 left-1.5">{bars('items-start')}</div>
        </div>
      )
  }
}

// Demo params for carousel tiles that get a REAL rendered preview instead of
// the abstract LayoutThumb diagram — grouped templates especially benefit
// since one carousel entry now stands in for several merged sub-layouts.
const CAROUSEL_DEMO_PARAMS: Record<string, Record<string, string>> = {
  'icon-layout': { headline: 'Now an official "partner"', icon: 'database' },
  'logo-layout': { headline: 'Acme joins Supabase' },
  'logo-grid': {
    headline: 'Supabase is now an "official [C]hat[GPT] app"',
    icons: 'supabase-bolt,openai-mark-ibnt',
  },
  announcement: { headline: '[H]ydra joins [S]upabase', icon: 'hydra-8cp3' },
}

/** Real rendered preview for carousel tiles listed in `CAROUSEL_DEMO_PARAMS`, instead of an abstract diagram. */
function TemplateCarouselThumb({ id, formatId }: { id: string; formatId: FormatId }) {
  const demo = CAROUSEL_DEMO_PARAMS[id]
  const endpoint = useMemo(() => {
    const p = new URLSearchParams()
    if (formatId !== DEFAULT_FORMAT_ID) p.set('format', formatId)
    p.set('template', id)
    Object.entries(demo ?? {}).forEach(([k, v]) => p.set(k, v))
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, formatId])
  const { url } = useRenderedImage(endpoint, !!demo)
  if (!demo || !url) return <LayoutThumb id={id} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExportRow({
  label,
  endpoint,
  imgUrl,
  downloadName,
  copied,
  onCopy,
  onDownload,
  onEnableThumb,
}: {
  label: string
  endpoint: string
  imgUrl: string | null
  downloadName: string
  copied: boolean
  onCopy: () => void
  onDownload: () => void
  onEnableThumb?: () => void
}) {
  const abs = typeof window !== 'undefined' ? window.location.origin + endpoint : endpoint
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground-light">{label}</span>
      {/* Thumb's render only fires once the Both/Thumb view is active (see
          showThumb in Page) — until then imgUrl is null and Download stays
          disabled, so point the user at the fix instead of a silent no-op. */}
      {!imgUrl && onEnableThumb && (
        <span className="text-xs text-foreground-lighter">
          Please review the thumb to enable download.{' '}
          <button
            type="button"
            onClick={onEnableThumb}
            className="text-foreground underline hover:text-foreground-light"
          >
            Click here.
          </button>
        </span>
      )}
      <div className="flex gap-2">
        <input
          readOnly
          value={abs}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 truncate rounded-md border border-default bg-surface-100 px-3 py-2 text-xs text-foreground-light outline-none focus:border-strong"
        />
        <button
          onClick={onCopy}
          title="Copy URL"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-default bg-surface-100 px-2.5 py-1 text-xs text-foreground hover:border-strong"
        >
          <CopyIcon />
          {copied ? 'Copied!' : ''}
        </button>
        <button
          onClick={onDownload}
          disabled={!imgUrl}
          title="Download"
          className="flex shrink-0 items-center justify-center rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-background hover:bg-brand/90 disabled:opacity-50"
        >
          <DownloadIcon />
        </button>
      </div>
    </div>
  )
}

function ExportModal({
  onClose,
  scale,
  setScale,
  rows,
}: {
  onClose: () => void
  scale: 1 | 2
  setScale: (s: 1 | 2) => void
  rows: {
    label: string
    endpoint: string
    imgUrl: string | null
    downloadName: string
    copied: boolean
    onCopy: () => void
    onDownload: () => void
    onEnableThumb?: () => void
  }[]
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex w-[440px] flex-col gap-4 rounded-xl border border-default bg-background p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Export images</span>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-foreground-light hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground-light">
          <input
            type="checkbox"
            checked={scale === 2}
            onChange={(e) => setScale(e.target.checked ? 2 : 1)}
          />
          Export @2x
        </label>

        <div className="flex flex-col gap-4 border-t border-default pt-4">
          {rows.map((r) => (
            <ExportRow key={r.label} {...r} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewCard({
  label,
  width,
  height,
  imgUrl,
  loading,
  error,
  alt,
  children,
}: {
  label: string
  width: number
  height: number
  imgUrl: string | null
  loading: boolean
  error: string | null
  alt: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-medium text-foreground-light">
        {label}
        <span className="ml-2 font-normal text-foreground-lighter">
          {width} × {height}
          {loading ? ' · rendering…' : ''}
        </span>
      </span>

      <div
        className="relative w-full overflow-hidden rounded-lg border border-default bg-surface-100"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {imgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={alt} className="h-full w-full" />
        )}
      </div>

      {children}

      {error && (
        <pre className="overflow-x-auto rounded-md border border-destructive-400 bg-destructive-200 p-3 text-xs text-destructive-600">
          {error}
        </pre>
      )}
    </div>
  )
}

export default function Page() {
  const [brandId, setBrandId] = useState<BrandId>(DEFAULT_BRAND_ID)
  const [formatId, setFormatId] = useState<FormatId>(DEFAULT_FORMAT_ID)
  const format = useMemo(() => getFormat(formatId), [formatId])
  const hasThumb = !!format.thumb
  const hasSecondary = !!format.secondary
  // Second preview slot exists either as a classic icon-only Thumb, or as a
  // format's second full composition (e.g. Social's Instagram variant).
  const hasSecondSlot = hasThumb || hasSecondary
  const primarySlotLabel = format.primaryLabel ?? format.label
  const secondSlotLabel = format.secondary?.label ?? 'Thumb'
  const secondSlotWidth = format.secondary?.width ?? format.width
  const secondSlotHeight = format.secondary?.height ?? format.height
  const viewOptions = useMemo(
    () => [
      { value: 'og' as const, label: primarySlotLabel },
      ...(hasSecondSlot
        ? [
            { value: 'thumb' as const, label: secondSlotLabel },
            { value: 'both' as const, label: 'Both' },
          ]
        : []),
    ],
    [primarySlotLabel, secondSlotLabel, hasSecondSlot]
  )
  // Newsletter has its own two-tile layout set. Social's primary composition
  // (1200x627) is close enough to OG's (1200x630) to reuse the same
  // TEMPLATES registry directly — its Instagram secondary gets its own
  // dedicated layout instead (INSTAGRAM_TEMPLATE_ID, forced below).
  const activeTemplates = formatId === 'newsletter' ? NEWSLETTER_TEMPLATES : TEMPLATES

  const [view, setView] = useState<View>('og')
  const [headline, setHeadline] = useState('Postgres full text search just got faster')
  const [eyebrow, setEyebrow] = useState('Engineering')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE_ID)
  const [icon, setIcon] = useState<string | null>(null)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  // Separates the picker grid (and its upload button) into line-art icons
  // vs. full-color logos — the two are rendered completely differently
  // (stroke-only vs. as-is) so browsing them mixed together was noisy.
  const [iconPickerTab, setIconPickerTab] = useState<'icon' | 'logo'>('icon')
  // Matches against name/label/tags — tags are the closest thing to a
  // "description" seed/Lucide icons carry today, so this is effectively a
  // light contextual search already, not just an exact-name lookup.
  const [iconPickerQuery, setIconPickerQuery] = useState('')
  const iconPickerRef = useRef<HTMLDivElement>(null)
  // logo-grid: 1-4 partner logo tiles, adjusted via a count stepper — each
  // slot holds its own icon/logo name (or null while unpicked).
  // Starts empty (not a seed icon default) — Partner logos only picks from
  // uploaded Logos now, and 'database' (a bundled line-art icon) wouldn't
  // resolve to anything in that restricted list.
  const [logoTileIcons, setLogoTileIcons] = useState<(string | null)[]>([null])
  const [logoTilePickerOpen, setLogoTilePickerOpen] = useState<number | null>(null)
  const [logoTilePickerQuery, setLogoTilePickerQuery] = useState('')
  const logoTilePickerRef = useRef<HTMLDivElement>(null)
  // logo-grid: whether the Supabase wordmark signature (bottom-right) renders
  // alongside the partner tiles — on by default, toggleable since the tiles
  // may already carry Supabase's own mark.
  const [showBrandLogo, setShowBrandLogo] = useState(true)
  // Which element-arrangement variant is active for the current template —
  // grouped templates (icon-layout, logo-layout, logo-grid) each merge
  // several sub-layouts behind one carousel entry; this cycles between them
  // via the "Alternate layouts" pager under the canvas. Reset to 0 whenever
  // the template changes so switching layouts doesn't carry over an
  // out-of-range arrangement index.
  const [arrangement, setArrangement] = useState(0)
  const arrangementCount = TEMPLATE_MAP[template]?.arrangementCount ?? 1
  useEffect(() => {
    setArrangement(0)
  }, [template])
  const [uploadedIcons, setUploadedIcons] = useState<SeedIcon[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const allIcons = useMemo(() => [...ICON_LIBRARY, ...uploadedIcons], [uploadedIcons])
  // Partner logos' tiles are meant for partner/acquisition brand marks —
  // restricted to uploaded Logos, not the bundled line-art Icons set.
  const allLogos = useMemo(() => allIcons.filter((i) => i.kind === 'logo'), [allIcons])
  const selectedTemplateObj = useMemo(
    () => activeTemplates.find((t) => t.id === template) ?? activeTemplates[0],
    [activeTemplates, template]
  )
  // Fixed-logo templates render the Supabase wordmark directly — there's no
  // user-selectable icon for them to affect, so hide the control entirely.
  const showIconControl = !selectedTemplateObj?.noIcon
  const showEyebrowControl =
    !selectedTemplateObj?.noEyebrow && !selectedTemplateObj?.noEyebrowForArrangement?.(arrangement)
  const selectedIcon = useMemo(() => allIcons.find((i) => i.name === icon) ?? null, [allIcons, icon])

  // icon-layout defaults to showing an icon (rather than the usual "None")
  // since the layout is designed around one — auto-pick the first time the
  // user lands on it with nothing selected yet.
  useEffect(() => {
    if (template === 'icon-layout' && !icon) setIcon('database')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  // Announcement is a partner/acquisition brand-mark composition — it wants
  // a full-color Logo, not a bundled line-art Icon. Ships with a curated
  // example (Hydra partnership) instead of an empty "Pick", same as Partner
  // logos' curated defaults — loads whenever the template is selected.
  useEffect(() => {
    if (template !== 'announcement') return
    setIconPickerTab('logo')
    setIcon('hydra-8cp3')
    setHeadline('[H]ydra joins [S]upabase')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  // Partner logos ships with a curated example per arrangement instead of
  // an empty "Pick" — arrangements 0/1 (2 tiles) showcase the ChatGPT app
  // partnership, 2/3 (4 tiles) showcase the Supabase for Platforms lineup;
  // within each pair the template's build() just flips headline/icon order,
  // so the content here only depends on which pair is active. Loads
  // whenever the template/arrangement pair is selected, same as clicking a
  // curated preset.
  useEffect(() => {
    if (template !== 'logo-grid') return
    if (arrangement === 0 || arrangement === 1) {
      setLogoTileIcons(['supabase-bolt', 'openai-mark-ibnt'])
      setHeadline('Supabase is now an "official [C]hat[GPT] app"')
      setEyebrow('')
    } else if (arrangement === 2 || arrangement === 3) {
      setLogoTileIcons(['lovable-zqj2', 'v0-tado', 'figma-zqyr', 'bolt-zr9w'])
      setHeadline('Introducing [S]upabase "for [P]latforms"')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, arrangement])

  // Load the shared asset library (uploaded icons) for the active brand; empty
  // when Supabase is off.
  useEffect(() => {
    fetch(`/api/assets?brand=${brandId}`)
      .then((r) => r.json())
      .then((d) => setUploadedIcons(d.assets ?? []))
      .catch(() => {})
  }, [brandId])

  // Newsletter swaps in its own layout set — reset to a valid default when
  // the active template isn't in the set the current format offers.
  useEffect(() => {
    if (!activeTemplates.some((t) => t.id === template)) {
      setTemplate(formatId === 'newsletter' ? DEFAULT_NEWSLETTER_TEMPLATE_ID : DEFAULT_TEMPLATE_ID)
    }
  }, [formatId, activeTemplates, template])

  // Format may drop the second preview slot (e.g. Newsletter/Luma have
  // neither a Thumb nor a secondary composition) — fall back to OG.
  useEffect(() => {
    if (!hasSecondSlot && view !== 'og') setView('og')
  }, [hasSecondSlot, view])

  // Close the icon dropdown on an outside click, like a real dropdown.
  useEffect(() => {
    if (!iconPickerOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setIconPickerOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [iconPickerOpen])

  // Same for the logo-grid per-tile pickers — one shared ref covers the
  // whole tile grid since only one tile's popover is open at a time.
  useEffect(() => {
    if (logoTilePickerOpen === null) return
    const onPointerDown = (e: PointerEvent) => {
      if (logoTilePickerRef.current && !logoTilePickerRef.current.contains(e.target as Node)) {
        setLogoTilePickerOpen(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [logoTilePickerOpen])

  // "Z" toggles the zoom tool; Escape cancels it; Alt (while active) flips
  // the cursor/click direction from zoom-in to zoom-out, matching
  // Illustrator/Photoshop. Ignored while typing in a text field.
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltHeld(true)
        return
      }
      if (isTyping(e.target)) return
      if (e.key === 'Escape') {
        setZoomToolActive(false)
      } else if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey) {
        setZoomToolActive((v) => !v)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(false)
    }
    // Alt can be released outside the window (e.g. after alt-tabbing) —
    // clear the stuck state once focus returns.
    const onBlur = () => setAltHeld(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const handleCanvasZoomClick = (e: React.MouseEvent) => {
    if (!zoomToolActive) return
    if (e.altKey) {
      setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))
    } else {
      setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))
    }
  }

  // SVG icons stay inline + stroke-recolored (unchanged); a PNG icon can't
  // be dynamically recolored, so it's stored as a file like a logo — same
  // client-side natural-size measurement as uploadLogo below. Expected to
  // already be a white/monochrome mark (label + accept type say so), not
  // enforced pixel-by-pixel.
  async function uploadOneIcon(file: File): Promise<SeedIcon> {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', 'icon')
    fd.append('brand', brandId)
    if (!isSvg) {
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
          URL.revokeObjectURL(url)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Could not read the image — is it a valid SVG or PNG?'))
        }
        img.src = url
      })
      fd.append('width', String(width))
      fd.append('height', String(height))
    }
    const res = await fetch('/api/assets', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Upload failed')
    return data.asset as SeedIcon
  }

  // Accepts one or many files (multi-select or drag-drop) — uploaded
  // sequentially so failures on one file don't abort the rest; the last
  // successfully uploaded icon becomes the active selection.
  const uploadIcon = async (files: File[]) => {
    setUploading(true)
    setUploadError(null)
    const errors: string[] = []
    let lastAsset: SeedIcon | null = null
    for (const file of files) {
      try {
        const asset = await uploadOneIcon(file)
        setUploadedIcons((prev) => [asset, ...prev])
        lastAsset = asset
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`)
      }
    }
    if (lastAsset) setIcon(lastAsset.name)
    if (errors.length) setUploadError(errors.join('; '))
    setUploading(false)
  }

  // Custom color logos (partnerships, acquisitions, co-marketing) — rendered
  // full-color, no stroke normalization. The browser measures natural pixel
  // size before upload so /api/og can fit it without distortion.
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  async function uploadOneLogo(file: File): Promise<SeedIcon> {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read the image — is it a valid SVG or PNG?'))
      }
      img.src = url
    })
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', 'logo')
    fd.append('brand', brandId)
    fd.append('width', String(width))
    fd.append('height', String(height))
    const res = await fetch('/api/assets', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Upload failed')
    return data.asset as SeedIcon
  }

  // Accepts one or many files — uploaded sequentially so failures on one
  // file don't abort the rest. `onSuccess` (used by the per-tile picker)
  // fires once per successfully uploaded logo with its position in the
  // batch, so e.g. a 3-file drop can fan out across the next 3 tiles; the
  // plain single-icon control instead just selects the last uploaded logo.
  const uploadLogo = async (files: File[], onSuccess?: (name: string, batchIndex: number) => void) => {
    setUploadingLogo(true)
    setLogoError(null)
    const errors: string[] = []
    let lastAsset: SeedIcon | null = null
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const asset = await uploadOneLogo(file)
        setUploadedIcons((prev) => [asset, ...prev])
        lastAsset = asset
        if (onSuccess) onSuccess(asset.name, i)
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`)
      }
    }
    if (!onSuccess && lastAsset) setIcon(lastAsset.name)
    if (errors.length) setLogoError(errors.join('; '))
    setUploadingLogo(false)
  }

  const [assetActionError, setAssetActionError] = useState<string | null>(null)
  // Inline rename/delete-confirm state — no window.prompt/confirm, which
  // some embedded/preview browser contexts silently block or auto-dismiss
  // (the likely cause of "the edit button doesn't do anything").
  const [renamingAssetName, setRenamingAssetName] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null)

  const startRename = (a: SeedIcon) => {
    setConfirmDeleteName(null)
    setRenamingAssetName(a.name)
    setRenameDraft(a.label)
  }

  const commitRename = async (a: SeedIcon) => {
    const nextLabel = renameDraft.trim()
    setRenamingAssetName(null)
    if (!nextLabel || nextLabel === a.label) return
    setAssetActionError(null)
    try {
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: a.name, brand: brandId, label: nextLabel }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAssetActionError(data.error ?? 'Rename failed')
        return
      }
      setUploadedIcons((prev) => prev.map((x) => (x.name === a.name ? (data.asset as SeedIcon) : x)))
    } catch {
      setAssetActionError('Rename failed — please try again.')
    }
  }

  const confirmDelete = async (a: SeedIcon) => {
    setConfirmDeleteName(null)
    setAssetActionError(null)
    try {
      const res = await fetch(`/api/assets?name=${encodeURIComponent(a.name)}&brand=${encodeURIComponent(brandId)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setAssetActionError(data.error ?? 'Delete failed')
        return
      }
      setUploadedIcons((prev) => prev.filter((x) => x.name !== a.name))
      if (icon === a.name) setIcon(null)
      setLogoTileIcons((tiles) => tiles.map((t) => (t === a.name ? null : t)))
    } catch {
      setAssetActionError('Delete failed — please try again.')
    }
  }

  const [scale, setScale] = useState<1 | 2>(1)
  const [inContext, setInContext] = useState<InContextMode>('none')
  const [exportOpen, setExportOpen] = useState(false)
  // Canvas zoom (brief follow-up) — scales the rendered image cards
  // themselves, not the surrounding UI/controls. 100% renders a card at its
  // actual pixel dimensions, which on a retina display is 2x the physical
  // pixels a normal screen shows — defaulting to 50% approximates native
  // resolution on typical (non-retina-aware-CSS) screens instead of a
  // 1200px-wide OG card dwarfing the canvas on load.
  const [zoom, setZoom] = useState(50)
  const ZOOM_MIN = 25
  const ZOOM_MAX = 200
  const ZOOM_STEP = 25
  // "Z" zoom tool (brief follow-up, Illustrator/Photoshop-style): toggles a
  // zoom cursor over the canvas; click to zoom in, Alt+click to zoom out.
  const [zoomToolActive, setZoomToolActive] = useState(false)
  const [altHeld, setAltHeld] = useState(false)

  const [copied, setCopied] = useState<View | null>(null)

  const showOg = view !== 'thumb'
  const showThumb = view !== 'og' && hasSecondSlot
  // The Blog-post in-context mockup mirrors the real page's hero, which
  // prefers the Thumb image — fetch it even if the OG/Thumb toggle itself
  // isn't showing Thumb right now.
  const wantsThumbForBlogPost = inContext === 'blog-post' && hasSecondSlot
  // Content controls (Layout/Eyebrow/Headline) stay visible whenever a full
  // composition is on screen — that includes viewing just the second slot
  // when it's a full composition too (e.g. Social's Instagram), unlike the
  // classic icon-only Thumb which has no headline to edit.
  const showContentControls = showOg || (view === 'thumb' && hasSecondary)

  const ogEndpoint = useMemo(() => {
    const p = new URLSearchParams()
    if (brandId !== DEFAULT_BRAND_ID) p.set('brand', brandId)
    if (formatId !== DEFAULT_FORMAT_ID) p.set('format', formatId)
    p.set('headline', headline)
    if (eyebrow.trim()) {
      p.set('eyebrow', eyebrow.trim())
      p.set('eyebrowStyle', 'pill')
    }
    p.set('template', template)
    if (template === 'logo-grid') {
      const names = logoTileIcons.filter((n): n is string => !!n)
      if (names.length) p.set('icons', names.join(','))
      if (!showBrandLogo) p.set('showLogo', '0')
    } else if (icon) {
      p.set('icon', icon)
    }
    if (arrangement) p.set('arrangement', String(arrangement))
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, formatId, headline, eyebrow, template, icon, logoTileIcons, arrangement, scale, showBrandLogo])

  const thumbEndpoint = useMemo(() => {
    const p = new URLSearchParams()
    if (brandId !== DEFAULT_BRAND_ID) p.set('brand', brandId)
    if (formatId !== DEFAULT_FORMAT_ID) p.set('format', formatId)
    if (hasSecondary) {
      // Full second composition — currently only Social's Instagram variant
      // (portrait, 1080x1350). Always renders through its own dedicated
      // layout (INSTAGRAM_TEMPLATE_ID), not whichever template is active for
      // the primary composition — none of the landscape-tuned arrangements
      // (fixed pixel icon offsets, etc.) translate to a portrait canvas.
      p.set('headline', headline)
      if (eyebrow.trim()) {
        p.set('eyebrow', eyebrow.trim())
        p.set('eyebrowStyle', 'pill')
      }
      p.set('template', INSTAGRAM_TEMPLATE_ID)
      if (icon) p.set('icon', icon)
      p.set('variant', 'secondary')
    } else {
      // The classic icon-only Thumb still needs `template` — some templates
      // (e.g. Announcement) override the default square icon crop via
      // `thumbBox`, which the render route looks up by template id.
      p.set('type', 'thumb')
      p.set('template', template)
      if (template === 'logo-grid') {
        const names = logoTileIcons.filter((n): n is string => !!n)
        if (names.length) p.set('icons', names.join(','))
      } else if (icon) {
        p.set('icon', icon)
      }
    }
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, formatId, hasSecondary, headline, eyebrow, template, icon, logoTileIcons, arrangement, scale, showBrandLogo])

  const og = useRenderedImage(ogEndpoint, showOg)
  const thumb = useRenderedImage(thumbEndpoint, showThumb || wantsThumbForBlogPost)

  const count = [...headline].length
  const counterColor =
    count > HARD_LIMIT
      ? 'text-destructive-600'
      : count >= SOFT_LIMIT
        ? 'text-warning-600'
        : 'text-foreground-lighter'

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

  const suffix = scale === 2 ? '@2x' : ''

  return (
    <div className="relative h-full overflow-hidden bg-background text-foreground">
      {/* Canvas — one continuous full-bleed dot-grid surface; the tool panel
          floats on top of it (absolutely positioned), not beside it. Scrolls
          independently of the two floating toolbars below, which are their
          own siblings so they stay anchored regardless of scroll position. */}
      <main
        className="@container absolute inset-0 flex flex-col items-center overflow-auto p-8 pt-24 pb-48 pr-[380px]"
        onClick={handleCanvasZoomClick}
        style={{
          backgroundColor: '#f4f4f5',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          cursor: zoomToolActive ? (altHeld ? 'zoom-out' : 'zoom-in') : undefined,
        }}
      >
        {inContext === 'none' ? (
          /* Fills the remaining canvas height; on wide/side-by-side screens
              the row centers within it. (flex-1 items don't shrink below
              their content, so this can't clip an overflowing row — it just
              grows.) */
          <div className="flex w-full flex-1 flex-col">
            {/* `mx-auto` centers the row horizontally while it fits, and
                automatically collapses to 0 (i.e. start-aligned) once it
                overflows — so zooming in never clips the leading edge.
                Top-aligned (not vertically centered) so the Alternate
                layouts pagination below always sits directly under the
                card instead of floating mid-canvas. Each card gets an
                explicit px width (format px × zoom) instead of stretching
                to fill — so 100% zoom renders the image at its actual
                pixel dimensions, not an arbitrary fraction of the canvas. */}
            <div className="mx-auto flex flex-col gap-6 @4xl:flex-row @4xl:items-start">
              {showOg && (
                <div className="min-w-0" style={{ width: `${Math.round(format.width * (zoom / 100))}px` }}>
                  <PreviewCard
                    label={primarySlotLabel}
                    width={format.width}
                    height={format.height}
                    imgUrl={og.url}
                    loading={og.loading}
                    error={og.error}
                    alt={headline}
                  />
                </div>
              )}

              {showThumb && (
                <div
                  className="min-w-0"
                  style={{ width: `${Math.round(secondSlotWidth * (zoom / 100))}px` }}
                >
                  <PreviewCard
                    label={secondSlotLabel}
                    width={secondSlotWidth}
                    height={secondSlotHeight}
                    imgUrl={thumb.url}
                    loading={thumb.loading}
                    error={thumb.error}
                    alt="Thumbnail preview"
                  />
                </div>
              )}
            </div>

            {/* Alternate layouts — cycles how a grouped template arranges
                its elements (icon-layout, logo-layout, logo-grid each merge
                several sub-layouts behind one carousel entry). Never
                changes content itself (e.g. logo-grid's tile count is the
                sidebar's "Logo tiles" stepper's job, not this pager's). */}
            {arrangementCount > 1 && showOg && (
              <div className="mx-auto mt-4 flex items-center gap-3 rounded-md border border-default bg-background px-4 py-2.5 shadow-lg">
                <span className="text-xs font-medium text-foreground-light">Alternate layouts</span>
                <button
                  type="button"
                  onClick={() => setArrangement((a) => (a - 1 + arrangementCount) % arrangementCount)}
                  title="Previous layout"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-default bg-surface-100 text-foreground-light hover:border-strong"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="w-10 text-center text-xs text-foreground-lighter">
                  {arrangement + 1} / {arrangementCount}
                </span>
                <button
                  type="button"
                  onClick={() => setArrangement((a) => (a + 1) % arrangementCount)}
                  title="Next layout"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-default bg-surface-100 text-foreground-light hover:border-strong"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* In-context preview takes over the full canvas — the OG/Thumb
              rectangles aren't the point here, seeing it "in the wild" is. */
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div
              className={`flex w-full flex-col gap-2 ${
                inContext === 'blog-post' || inContext === 'blog' ? 'max-w-5xl' : 'max-w-2xl'
              }`}
            >
              <span className="text-xs font-medium text-foreground-light">
                {IN_CONTEXT_OPTS.find((o) => o.value === inContext)?.label}
              </span>
              <InContextPreview
                mode={inContext}
                imgUrl={og.url}
                thumbImgUrl={thumb.url}
                headline={headline}
                eyebrow={eyebrow.trim() || null}
                aspect={`${format.width} / ${format.height}`}
              />
            </div>
          </div>
        )}
      </main>

      {/* View toggle — anchored to the top of the canvas, independent of
          main's scroll (a sibling, not a child of the scroll container).
          Hidden entirely when a format only has one view (e.g. Newsletter,
          Luma) — nothing to toggle between. */}
      {viewOptions.length > 1 && (
        <div className="pointer-events-none absolute left-8 right-[380px] top-6 z-10 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-default bg-background px-3 py-2 shadow-lg">
            <Segmented value={view} onChange={setView} options={viewOptions} />
          </div>
        </div>
      )}

      {/* Floating guides / view-in-context / zoom toolbar — bottom-aligned,
          centered on the same content box as the View toggle above, and
          likewise anchored outside main's scroll container. Stacked in a
          column with the Layout carousel (when applicable) so the canvas
          only ever has controls floating on the bottom edge, not scattered
          across corners. Capped to a fraction of the viewport height and
          made internally scrollable so that on short windows (or in "Both"
          view, where the carousel row + preview/zoom row can be tall
          relative to the window) the cluster shrinks instead of overflowing
          past the bottom edge or overlapping canvas content underneath. */}
      <div className="pointer-events-none absolute bottom-6 left-8 right-[380px] z-10 flex max-h-[40vh] flex-col items-center gap-3 overflow-y-auto">
        {showContentControls && inContext === 'none' && (
          <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-md border border-default bg-background p-2 shadow-lg">
            {activeTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                title={t.label}
                className="group flex w-28 shrink-0 flex-col gap-1"
              >
                <span
                  className={`truncate text-left text-[10px] ${
                    template === t.id ? 'font-semibold text-brand' : 'text-foreground-lighter'
                  }`}
                >
                  {t.label}
                </span>
                <div
                  data-theme="dark"
                  className={`relative w-full overflow-hidden rounded-md bg-background ${
                    template === t.id
                      ? 'border-2 border-brand'
                      : 'border border-default hover:border-strong'
                  }`}
                  style={{ aspectRatio: `${format.width} / ${format.height}` }}
                >
                  {CAROUSEL_DEMO_PARAMS[t.id] ? (
                    <TemplateCarouselThumb id={t.id} formatId={formatId} />
                  ) : (
                    <LayoutThumb id={t.id} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-default bg-background px-3 py-2 shadow-lg">
          {showOg && (
            <>
              <span className="text-xs font-medium text-foreground-light">Preview</span>
              <Segmented value={inContext} onChange={setInContext} options={IN_CONTEXT_OPTS} />
            </>
          )}
          {inContext === 'none' && (
            <>
              <div className="h-5 border-l border-default" />
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setZoomToolActive((v) => !v)}
                  title="Zoom tool (Z) — click to zoom in, Alt+click to zoom out"
                  className={`flex h-6 w-6 items-center justify-center rounded ${
                    zoomToolActive ? 'bg-brand/20 text-brand' : 'text-foreground-light hover:text-foreground'
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    <path d="M8 11h6" strokeLinecap="round" />
                    {!altHeld && <path d="M11 8v6" strokeLinecap="round" />}
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  disabled={zoom <= ZOOM_MIN}
                  title="Zoom out"
                  className="flex h-6 w-6 items-center justify-center rounded text-foreground-light hover:text-foreground disabled:opacity-30"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  title="Reset zoom"
                  className="w-9 text-center text-xs tabular-nums text-foreground-light hover:text-foreground"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  disabled={zoom >= ZOOM_MAX}
                  title="Zoom in"
                  className="flex h-6 w-6 items-center justify-center rounded text-foreground-light hover:text-foreground disabled:opacity-30"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating tool panel — packaged top bar + all controls, docked right.
          Absolutely positioned (not a flex sibling) so the canvas behind it
          is one continuous surface, not two boxes split by a shared edge. */}
      <aside className="absolute right-4 top-4 bottom-4 z-10 flex w-[340px] flex-col overflow-hidden rounded-xl border border-default bg-background shadow-lg">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-default px-5">
          <span className="text-sm font-medium text-foreground">Supaimage</span>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-background hover:bg-brand/90"
          >
            Export
          </button>
        </div>
        <div className="flex flex-col overflow-y-auto overflow-x-hidden p-5">
          <Group title="Brand & format">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">Brand</span>
              <Segmented
                value={brandId}
                onChange={setBrandId}
                options={BRAND_OPTIONS.map((b) => ({
                  value: b.id,
                  label: b.label,
                  disabled: b.id !== DEFAULT_BRAND_ID,
                  title: b.id !== DEFAULT_BRAND_ID ? 'Coming soon' : undefined,
                }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">Format</span>
              <div className="flex flex-col gap-1.5">
                {FORMAT_OPTIONS.map((f) => {
                  const fmt = getFormat(f.id)
                  const active = formatId === f.id
                  const disabled = f.id !== DEFAULT_FORMAT_ID
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => !disabled && setFormatId(f.id)}
                      disabled={disabled}
                      title={disabled ? 'Coming soon' : undefined}
                      className={`flex w-full flex-col rounded-md border px-3 py-2.5 text-left transition ${
                        disabled
                          ? 'cursor-not-allowed border-default bg-surface-100 opacity-50'
                          : active
                            ? 'border-brand bg-brand/10'
                            : 'border-default bg-surface-100 hover:border-strong'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          disabled ? 'text-foreground-lighter' : active ? 'text-brand' : 'text-foreground'
                        }`}
                      >
                        {f.label}
                      </span>
                      <span className="text-xs text-foreground-lighter">{fmt.blurb}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Group>

          <Group title="Content" noDivider>
            {showContentControls && showEyebrowControl && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="eyebrow" className="text-sm font-medium text-foreground-light">
                    Eyebrow <span className="text-foreground-lighter">(optional)</span>
                  </label>
                  <span className="text-xs tabular-nums text-foreground-lighter">
                    {[...eyebrow].length} / {EYEBROW_LIMIT}
                  </span>
                </div>
                <input
                  id="eyebrow"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(clampChars(e.target.value, EYEBROW_LIMIT))}
                  maxLength={EYEBROW_LIMIT}
                  className="rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                  placeholder="e.g. Launch Week, Engineering"
                />
              </div>
            )}

            {showContentControls && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="headline" className="text-sm font-medium text-foreground-light">
                    Headline
                    <Hint text="Sentence case is applied to headlines. See the instructions below for overrides." />
                  </label>
                  <span className={`text-xs tabular-nums ${counterColor}`}>
                    {count} / {HARD_LIMIT}
                  </span>
                </div>
                <textarea
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(clampChars(e.target.value, HARD_LIMIT))}
                  maxLength={HARD_LIMIT}
                  rows={3}
                  className="resize-none rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                  placeholder="Type a blog headline…"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-foreground-lighter">Text overrides</span>
                  <p className="flex items-center justify-between gap-1.5 text-xs text-foreground-lighter">
                    <span>Manual line break</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <kbd className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-default bg-surface-100 font-mono text-[10px] leading-none text-foreground-light">
                        ↵
                      </kbd>
                      ENTER
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-1.5 text-xs text-foreground-lighter">
                    <span>Capitalize letter e.g. [p]ostgre[sql] → PostgreSQL</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <kbd className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-default bg-surface-100 font-mono text-[10px] leading-none text-foreground-light">
                        []
                      </kbd>
                      BRACKETS
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-1.5 text-xs text-foreground-lighter">
                    <span>Green highlight</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <kbd className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-default bg-surface-100 font-mono text-[10px] leading-none text-foreground-light">
                        &quot;
                      </kbd>
                      QUOTATION
                    </span>
                  </p>
                </div>
              </div>
            )}

            {showIconControl && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">
                Icon
                <Hint text="Line-art icons (SVG) are stroke-recolored to the illustration weight (§4); uploaded icon images (PNG) should already be white/monochrome, since they render as-is. Logos (SVG or PNG) keep their original colors, for partnerships/acquisitions. The icon is shared between the OG and Thumb. Both are stored in Supabase and need the secret key configured." />
              </span>
              <div className="relative" ref={iconPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIconPickerOpen((o) => !o)
                    setIconPickerQuery('')
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none hover:border-strong focus:border-strong"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border border-default text-foreground-light ${
                      selectedIcon?.url ? LOGO_SWATCH_BG : 'bg-background'
                    }`}
                  >
                    {selectedIcon ? (
                      selectedIcon.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedIcon.url}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <svg
                          width={14}
                          height={14}
                          viewBox={selectedIcon.viewBox}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: selectedIcon.body }}
                        />
                      )
                    ) : (
                      <span className="text-[9px] text-foreground-lighter">—</span>
                    )}
                  </span>
                  <span className="flex-1 truncate text-left">
                    {selectedIcon ? selectedIcon.label : 'None'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {iconPickerOpen && (
                  <div className="absolute bottom-full z-20 mb-1 w-full rounded-md border border-strong bg-background p-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
                    <div className="mb-2 flex items-center gap-2">
                      <Segmented
                        value={iconPickerTab}
                        onChange={setIconPickerTab}
                        options={[
                          { value: 'icon', label: 'Icons' },
                          { value: 'logo', label: 'Logos' },
                        ]}
                      />
                      <input
                        type="text"
                        value={iconPickerQuery}
                        onChange={(e) => setIconPickerQuery(e.target.value)}
                        placeholder="Search…"
                        className="min-w-0 flex-1 rounded-md border border-default bg-surface-100 px-2 py-1 text-xs text-foreground outline-none focus:border-strong"
                      />
                    </div>
                    <div
                      className={`grid max-h-72 gap-2 overflow-y-auto ${
                        iconPickerTab === 'logo' ? 'grid-cols-2' : 'grid-cols-4'
                      }`}
                    >
                      {!iconPickerQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setIcon(null)
                            setIconPickerOpen(false)
                          }}
                          title="No icon"
                          className={`flex items-center justify-center rounded-md border text-xs ${
                            iconPickerTab === 'logo' ? 'h-20' : 'h-14'
                          } ${
                            icon === null
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-default bg-surface-100 text-foreground-lighter hover:border-strong'
                          }`}
                        >
                          None
                        </button>
                      )}
                      {allIcons
                        .filter((ic) => (iconPickerTab === 'logo' ? ic.kind === 'logo' : ic.kind !== 'logo'))
                        .filter((ic) => matchesIconQuery(ic, iconPickerQuery))
                        .map((ic) => {
                          const isUploaded = uploadedIcons.some((u) => u.name === ic.name)
                          const isLogoTab = iconPickerTab === 'logo'

                          if (renamingAssetName === ic.name) {
                            return (
                              <div
                                key={ic.name}
                                className={`col-span-1 flex flex-col justify-center gap-1 rounded-md border border-brand bg-brand/5 p-1.5 ${
                                  isLogoTab ? 'h-20' : 'h-14'
                                }`}
                              >
                                <input
                                  autoFocus
                                  type="text"
                                  value={renameDraft}
                                  onChange={(e) => setRenameDraft(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitRename(ic)
                                    if (e.key === 'Escape') setRenamingAssetName(null)
                                  }}
                                  className="w-full rounded border border-default bg-background px-1.5 py-1 text-xs text-foreground outline-none focus:border-strong"
                                />
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      commitRename(ic)
                                    }}
                                    className="flex-1 rounded bg-brand py-1 text-[11px] font-medium text-background hover:bg-brand/90"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRenamingAssetName(null)
                                    }}
                                    className="flex-1 rounded border border-default text-[11px] text-foreground-light hover:border-strong"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          if (confirmDeleteName === ic.name) {
                            return (
                              <div
                                key={ic.name}
                                className={`col-span-1 flex flex-col items-center justify-center gap-1.5 rounded-md border border-destructive-500 bg-destructive-200/40 p-1.5 ${
                                  isLogoTab ? 'h-20' : 'h-14'
                                }`}
                              >
                                <span className="text-center text-[11px] leading-tight text-foreground">Delete?</span>
                                <div className="flex w-full gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      confirmDelete(ic)
                                    }}
                                    className="flex-1 rounded bg-destructive-600 py-1 text-[11px] font-medium text-white hover:bg-destructive-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDeleteName(null)
                                    }}
                                    className="flex-1 rounded border border-default text-[11px] text-foreground-light hover:border-strong"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={ic.name} className="group relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setIcon(ic.name)
                                  setIconPickerOpen(false)
                                }}
                                title={ic.url ? `${ic.label} (uploaded)` : ic.label}
                                className={`flex w-full items-center justify-center rounded-md border p-1.5 ${
                                  isLogoTab ? 'h-20' : 'h-14'
                                } ${pickerSwatchClass(icon === ic.name, !!ic.url)}`}
                              >
                                {ic.url ? (
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
                              {isUploaded && (
                                <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startRename(ic)
                                    }}
                                    title="Rename"
                                    className="flex h-6 w-6 items-center justify-center rounded bg-background text-foreground-light shadow hover:text-foreground"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRenamingAssetName(null)
                                      setConfirmDeleteName(ic.name)
                                    }}
                                    title="Delete"
                                    className="flex h-6 w-6 items-center justify-center rounded bg-background text-foreground-light shadow hover:text-destructive-600"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-.8 13.6a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                    {assetActionError && <p className="mt-2 text-xs text-warning-600">{assetActionError}</p>}
                    <div className="mt-2">
                      {iconPickerTab === 'icon' ? (
                        <label
                          className={`block rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                            uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'
                          }`}
                        >
                          {uploading ? 'Uploading…' : '+ Upload white icon(s) (.svg or .png only)'}
                          <input
                            type="file"
                            multiple
                            accept=".svg,.png,image/svg+xml,image/png"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? [])
                              if (files.length) uploadIcon(files)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      ) : (
                        <label
                          className={`block rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                            uploadingLogo ? 'cursor-wait opacity-70' : 'cursor-pointer'
                          }`}
                        >
                          {uploadingLogo ? 'Uploading…' : '+ Upload color/white logo(s) (.svg or .png only)'}
                          <input
                            type="file"
                            multiple
                            accept=".svg,.png,image/svg+xml,image/png"
                            className="hidden"
                            disabled={uploadingLogo}
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? [])
                              if (files.length) uploadLogo(files)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {uploadError && <p className="mt-2 text-xs text-warning-600">{uploadError}</p>}
                    {logoError && <p className="mt-2 text-xs text-warning-600">{logoError}</p>}
                  </div>
                )}
              </div>
            </div>
            )}


            {template === 'logo-grid' && (
              <label className="flex items-center gap-2 text-sm text-foreground-light">
                <input
                  type="checkbox"
                  checked={showBrandLogo}
                  onChange={(e) => setShowBrandLogo(e.target.checked)}
                />
                Show Supabase logo
                <Hint text="Toggles the Supabase wordmark signature in the corner — off if the partner tiles already speak for themselves." />
              </label>
            )}

            {template === 'logo-grid' && (
              <div className="flex flex-col gap-2">
                <span className="flex items-center justify-between text-sm font-medium text-foreground-light">
                  <span>
                    Logo tiles
                    <Hint text="Cycle through 1-4 partner-logo tiles. Each tile picks from uploaded Logos only, not the bundled Icons set." />
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setLogoTileIcons((tiles) => (tiles.length > 1 ? tiles.slice(0, -1) : tiles))
                      }
                      disabled={logoTileIcons.length <= 1}
                      title="Fewer tiles"
                      className="flex h-6 w-6 items-center justify-center rounded border border-default bg-surface-100 text-foreground-light hover:border-strong disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xs text-foreground-lighter">
                      {logoTileIcons.length} / 4
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setLogoTileIcons((tiles) => (tiles.length < 4 ? [...tiles, randomIconName(allLogos)] : tiles))
                      }
                      disabled={logoTileIcons.length >= 4}
                      title="More tiles"
                      className="flex h-6 w-6 items-center justify-center rounded border border-default bg-surface-100 text-foreground-light hover:border-strong disabled:opacity-40"
                    >
                      +
                    </button>
                  </span>
                </span>
                <div className="grid grid-cols-4 gap-2" ref={logoTilePickerRef}>
                  {logoTileIcons.map((tileIcon, tileIdx) => {
                    const tileSelected = allLogos.find((i) => i.name === tileIcon) ?? null
                    return (
                      <div key={tileIdx} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setLogoTilePickerOpen((open) => (open === tileIdx ? null : tileIdx))
                            setLogoTilePickerQuery('')
                          }}
                          title={tileSelected ? tileSelected.label : `Tile ${tileIdx + 1}`}
                          className={`flex h-14 w-full items-center justify-center rounded-md border p-1.5 text-foreground-light hover:border-strong ${
                            tileSelected?.url ? `border-default ${LOGO_SWATCH_BG}` : 'border-default bg-surface-100'
                          }`}
                        >
                          {tileSelected ? (
                            tileSelected.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tileSelected.url}
                                alt={tileSelected.label}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <svg
                                width={22}
                                height={22}
                                viewBox={tileSelected.viewBox}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dangerouslySetInnerHTML={{ __html: tileSelected.body }}
                              />
                            )
                          ) : (
                            <span className="text-[10px] text-foreground-lighter">Pick</span>
                          )}
                        </button>

                        {logoTilePickerOpen === tileIdx && (
                          <div
                            className={`absolute bottom-full z-20 mb-1 w-56 rounded-md border border-strong bg-background p-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/5 ${
                              tileIdx >= 2 ? 'right-0' : 'left-0'
                            }`}
                          >
                            <input
                              type="text"
                              value={logoTilePickerQuery}
                              onChange={(e) => setLogoTilePickerQuery(e.target.value)}
                              placeholder="Search…"
                              className="mb-2 w-full rounded-md border border-default bg-surface-100 px-2 py-1 text-xs text-foreground outline-none focus:border-strong"
                            />
                            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto">
                              {!logoTilePickerQuery.trim() && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLogoTileIcons((tiles) =>
                                      tiles.map((t, i) => (i === tileIdx ? null : t))
                                    )
                                    setLogoTilePickerOpen(null)
                                  }}
                                  title="No logo"
                                  className={`flex h-20 items-center justify-center rounded-md border text-xs ${
                                    tileIcon === null
                                      ? 'border-brand bg-brand/10 text-brand'
                                      : 'border-default bg-surface-100 text-foreground-lighter hover:border-strong'
                                  }`}
                                >
                                  None
                                </button>
                              )}
                              {allLogos
                                .filter((ic) => matchesIconQuery(ic, logoTilePickerQuery))
                                .map((ic) => (
                                  <button
                                    key={ic.name}
                                    type="button"
                                    onClick={() => {
                                      setLogoTileIcons((tiles) =>
                                        tiles.map((t, i) => (i === tileIdx ? ic.name : t))
                                      )
                                      setLogoTilePickerOpen(null)
                                    }}
                                    title={ic.url ? `${ic.label} (uploaded)` : ic.label}
                                    className={`flex h-20 items-center justify-center rounded-md border p-1 ${pickerSwatchClass(
                                      tileIcon === ic.name,
                                      !!ic.url
                                    )}`}
                                  >
                                    {ic.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={ic.url}
                                        alt={ic.label}
                                        className="max-h-full max-w-full object-contain"
                                      />
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
                            <div className="mt-2">
                              <label
                                className={`block rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                                  uploadingLogo ? 'cursor-wait opacity-70' : 'cursor-pointer'
                                }`}
                              >
                                {uploadingLogo ? 'Uploading…' : '+ Upload color/white logo(s) (.svg or .png only)'}
                                <input
                                  type="file"
                                  multiple
                                  accept=".svg,.png,image/svg+xml,image/png"
                                  className="hidden"
                                  disabled={uploadingLogo}
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files ?? [])
                                    if (files.length) {
                                      // Fan out across tiles starting at the one clicked — a
                                      // 3-file drop on tile 2 fills tiles 2, 3, 4 (capped at 4).
                                      uploadLogo(files, (name, i) => {
                                        const target = tileIdx + i
                                        if (target > 3) return
                                        setLogoTileIcons((tiles) => {
                                          const next =
                                            tiles.length > target
                                              ? [...tiles]
                                              : [...tiles, ...Array(target - tiles.length + 1).fill(null)]
                                          next[target] = name
                                          return next.slice(0, 4)
                                        })
                                      })
                                      setLogoTilePickerOpen(null)
                                    }
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                              {logoError && <p className="mt-2 text-xs text-warning-600">{logoError}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Group>
        </div>
      </aside>

      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          scale={scale}
          setScale={setScale}
          rows={[
            {
              label: primarySlotLabel,
              endpoint: ogEndpoint,
              imgUrl: og.url,
              downloadName: `og${suffix}.png`,
              copied: copied === 'og',
              onCopy: () => copyUrl(ogEndpoint, 'og'),
              onDownload: () => download(og.url, `og${suffix}.png`),
            },
            ...(hasSecondSlot
              ? [
                  {
                    label: secondSlotLabel,
                    endpoint: thumbEndpoint,
                    imgUrl: thumb.url,
                    downloadName: `${secondSlotLabel.toLowerCase()}${suffix}.png`,
                    copied: copied === 'thumb',
                    onCopy: () => copyUrl(thumbEndpoint, 'thumb'),
                    onDownload: () => download(thumb.url, `${secondSlotLabel.toLowerCase()}${suffix}.png`),
                    onEnableThumb: () => setView('both'),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  )
}
