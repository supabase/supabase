'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'

type LocalFont = {
  family: string
  dir: string
  faces: { file: string; weight: number; italicSuffix: string; italicFile?: string; ext?: string }[]
}

const LOCAL_FONTS: LocalFont[] = [
  {
    family: 'Soehne',
    dir: '/fonts/soehne',
    faces: [
      { file: 'test-soehne-extraleicht', weight: 200, italicSuffix: '-kursiv' },
      { file: 'test-soehne-leicht', weight: 300, italicSuffix: '-kursiv' },
      { file: 'test-soehne-buch', weight: 400, italicSuffix: '-kursiv' },
      { file: 'test-soehne-kraftig', weight: 500, italicSuffix: '-kursiv' },
      { file: 'test-soehne-halbfett', weight: 600, italicSuffix: '-kursiv' },
      { file: 'test-soehne-dreiviertelfett', weight: 700, italicSuffix: '-kursiv' },
      { file: 'test-soehne-fett', weight: 800, italicSuffix: '-kursiv' },
      { file: 'test-soehne-extrafett', weight: 900, italicSuffix: '-kursiv' },
    ],
  },
  {
    family: 'Untitled Sans',
    dir: '/fonts/untitled',
    faces: [
      { file: 'test-untitled-sans-light', weight: 300, italicSuffix: '-italic' },
      {
        file: 'test-untitled-sans-regular',
        weight: 400,
        italicSuffix: '',
        italicFile: 'test-untitled-sans-italic',
      },
      { file: 'test-untitled-sans-medium', weight: 500, italicSuffix: '-italic' },
      { file: 'test-untitled-sans-bold', weight: 700, italicSuffix: '-italic' },
      { file: 'test-untitled-sans-black', weight: 900, italicSuffix: '-italic' },
    ],
  },
  {
    family: 'Suisse Intl',
    dir: '/fonts/suisse',
    faces: [
      { file: 'SuisseIntl-Thin', weight: 100, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Ultralight', weight: 200, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Light', weight: 300, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Regular', weight: 400, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Book', weight: 450, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Medium', weight: 500, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-SemiBold', weight: 600, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Bold', weight: 700, italicSuffix: 'Italic', ext: 'otf' },
      { file: 'SuisseIntl-Black', weight: 900, italicSuffix: 'Italic', ext: 'otf' },
    ],
  },
  {
    family: 'Signifier',
    dir: '/fonts/signifier',
    faces: [
      { file: 'test-signifier-thin', weight: 100, italicSuffix: '-italic' },
      { file: 'test-signifier-extralight', weight: 200, italicSuffix: '-italic' },
      { file: 'test-signifier-light', weight: 300, italicSuffix: '-italic' },
      { file: 'test-signifier-regular', weight: 400, italicSuffix: '-italic' },
      { file: 'test-signifier-medium', weight: 500, italicSuffix: '-italic' },
      { file: 'test-signifier-bold', weight: 700, italicSuffix: '-italic' },
      { file: 'test-signifier-black', weight: 900, italicSuffix: '-italic' },
    ],
  },
]

function localFontStyleId(family: string) {
  return `font-devtools-${family.toLowerCase().replace(/\s+/g, '-')}`
}

function ensureLocalFont(font: LocalFont) {
  const id = localFontStyleId(font.family)
  if (document.getElementById(id)) return
  const el = document.createElement('style')
  el.id = id
  el.textContent = font.faces
    .flatMap(({ file, weight, italicSuffix, italicFile, ext: faceExt }) => {
      const ext = faceExt || 'woff2'
      const fmt = ext === 'otf' ? 'opentype' : ext === 'ttf' ? 'truetype' : ext
      const rules = [
        `@font-face { font-family: "${font.family}"; src: url("${font.dir}/${file}.${ext}") format("${fmt}"); font-weight: ${weight}; font-style: normal; font-display: swap; }`,
      ]
      const itFile = italicFile
        ? `${font.dir}/${italicFile}.${ext}`
        : italicSuffix
          ? `${font.dir}/${file}${italicSuffix}.${ext}`
          : null
      if (itFile) {
        rules.push(
          `@font-face { font-family: "${font.family}"; src: url("${itFile}") format("${fmt}"); font-weight: ${weight}; font-style: italic; font-display: swap; }`
        )
      }
      return rules
    })
    .join('\n')
  document.head.appendChild(el)
}

function removeLocalFont(family: string) {
  document.getElementById(localFontStyleId(family))?.remove()
}

type GoogleFont = {
  family: string
  weights?: number[]
}

const GOOGLE_FONTS: GoogleFont[] = [
  { family: 'Manrope', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Inter', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
]

function googleFontStyleId(family: string) {
  return `font-devtools-google-${family.toLowerCase().replace(/\s+/g, '-')}`
}

function ensureGoogleFont(font: GoogleFont) {
  const id = googleFontStyleId(font.family)
  if (document.getElementById(id)) return
  const weights = font.weights?.join(';') ?? '400'
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@${weights}&display=swap`
  document.head.appendChild(link)
}

function removeGoogleFont(family: string) {
  document.getElementById(googleFontStyleId(family))?.remove()
}

function fv(family: string) {
  return `"${family}", ui-sans-serif, system-ui, sans-serif`
}

const PRIMA = 'var(--font-ktf-prima), ui-sans-serif, system-ui, sans-serif'
const SOEHNE = fv('Soehne')
const UNTITLED = fv('Untitled Sans')
const SUISSE = fv('Suisse Intl')
const SIGNIFIER = `"Signifier", ui-serif, Georgia, serif`
const MANROPE = fv('Manrope')
const INTER = fv('Inter')
const GEIST_MONO = 'var(--font-geist-mono), ui-monospace, Menlo, monospace'

type FontOption = {
  label: string
  heading: string
  copy: string
  localFamilies?: string[]
  googleFamilies?: string[]
}

type MonoOption = {
  label: string
  value: string
}

const FONT_OPTIONS: FontOption[] = [
  // Single fonts
  { label: 'KTF Prima', heading: PRIMA, copy: PRIMA },
  { label: 'Soehne', heading: SOEHNE, copy: SOEHNE, localFamilies: ['Soehne'] },
  { label: 'Untitled Sans', heading: UNTITLED, copy: UNTITLED, localFamilies: ['Untitled Sans'] },
  { label: 'Suisse Intl', heading: SUISSE, copy: SUISSE, localFamilies: ['Suisse Intl'] },

  // Combinations: heading + copy
  {
    label: 'Signifier + KTF Prima',
    heading: SIGNIFIER,
    copy: PRIMA,
    localFamilies: ['Signifier'],
  },
  {
    label: 'Signifier + Soehne',
    heading: SIGNIFIER,
    copy: SOEHNE,
    localFamilies: ['Signifier', 'Soehne'],
  },
  {
    label: 'Signifier + Untitled Sans',
    heading: SIGNIFIER,
    copy: UNTITLED,
    localFamilies: ['Signifier', 'Untitled Sans'],
  },
  {
    label: 'Signifier + Suisse Intl',
    heading: SIGNIFIER,
    copy: SUISSE,
    localFamilies: ['Signifier', 'Suisse Intl'],
  },
  {
    label: 'Manrope + Inter',
    heading: MANROPE,
    copy: INTER,
    googleFamilies: ['Manrope', 'Inter'],
  },
]

const MONO_OPTIONS: MonoOption[] = [
  { label: 'Geist Mono', value: GEIST_MONO },
]

const STORAGE_KEY = 'www-font-devtools'
const STYLE_ID = 'font-devtools-override'

function getStored(): { selected?: string; mono?: string } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function applyOverrides(option?: FontOption, mono?: string) {
  // Manage local font @font-face injection
  const needed = new Set(option?.localFamilies ?? [])
  for (const font of LOCAL_FONTS) {
    if (needed.has(font.family)) {
      ensureLocalFont(font)
    } else {
      removeLocalFont(font.family)
    }
  }

  // Manage Google font loading
  const neededGoogle = new Set(option?.googleFamilies ?? [])
  for (const font of GOOGLE_FONTS) {
    if (neededGoogle.has(font.family)) {
      ensureGoogleFont(font)
    } else {
      removeGoogleFont(font.family)
    }
  }

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  const rules: string[] = []

  if (option) {
    rules.push(`:root { --font-sans: ${option.copy} !important; }`)
    if (option.heading !== option.copy) {
      rules.push(
        `h1, h2, h3, h4, h5, h6 { font-family: ${option.heading} !important; }`
      )
    }
  }
  if (mono) {
    rules.push(`:root { --font-mono: ${mono} !important; }`)
  }

  if (rules.length === 0) {
    el?.remove()
    return
  }

  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = rules.join('\n')
}

export function FontDevtools() {
  const [selected, setSelected] = useState('')
  const [mono, setMono] = useState('')

  useEffect(() => {
    const stored = getStored()
    if (stored.selected) setSelected(stored.selected)
    if (stored.mono) setMono(stored.mono)
    if (stored.selected || stored.mono) {
      const option = FONT_OPTIONS.find((o) => o.label === stored.selected)
      applyOverrides(option, stored.mono)
    }
  }, [])

  const update = useCallback(
    (label: string) => {
      setSelected(label)
      const option = FONT_OPTIONS.find((o) => o.label === label)
      applyOverrides(option, mono || undefined)
      const stored: Record<string, string> = { selected: label }
      if (mono) stored.mono = mono
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    },
    [mono]
  )

  const updateMono = useCallback(
    (value: string) => {
      setMono(value)
      const option = selected ? FONT_OPTIONS.find((o) => o.label === selected) : undefined
      applyOverrides(option, value)
      const stored: Record<string, string> = { mono: value }
      if (selected) stored.selected = selected
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    },
    [selected]
  )

  const reset = useCallback(() => {
    setSelected('')
    setMono('')
    applyOverrides()
    for (const font of LOCAL_FONTS) removeLocalFont(font.family)
    for (const font of GOOGLE_FONTS) removeGoogleFont(font.family)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const singles = FONT_OPTIONS.filter((o) => !o.label.includes(' + '))
  const combos = FONT_OPTIONS.filter((o) => o.label.includes(' + '))

  const optionButton = (o: { label: string }, active: boolean, onClick: () => void) => (
    <button
      key={o.label}
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
        active
          ? 'bg-surface-200 text-foreground'
          : 'text-foreground-light hover:bg-surface-100'
      }`}
    >
      {o.label}
    </button>
  )

  return (
    <div className="fixed bottom-4 right-4 z-[99999]">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="outline"
            size="tiny"
            className="rounded-full px-2.5 font-mono text-xs"
          >
            Aa
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-56 p-0">
          <div className="px-3 pt-3 pb-2">
            <p className="text-xs font-medium text-foreground-light uppercase tracking-wider">
              Font Devtools
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto px-1 pb-1">
            <div className="px-2 pt-1 pb-1">
              <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                Single
              </p>
            </div>
            {singles.map((o) =>
              optionButton(o, selected === o.label, () => update(o.label))
            )}

            <div className="px-2 pt-3 pb-1">
              <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                Heading + Copy
              </p>
            </div>
            {combos.map((o) =>
              optionButton(o, selected === o.label, () => update(o.label))
            )}

            <div className="px-2 pt-3 pb-1">
              <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                Mono
              </p>
            </div>
            {MONO_OPTIONS.map((o) =>
              optionButton(o, mono === o.value, () => updateMono(o.value))
            )}
          </div>

          <div className="border-t px-2 py-2">
            <Button type="default" size="tiny" block onClick={reset}>
              Reset to defaults
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
