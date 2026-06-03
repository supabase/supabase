'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useInView } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'
import { Button } from 'ui'

// ── Pixel font (5×7 per glyph) ─────────────────────────────────────────────

const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['01110', '10001', '00001', '00110', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10001', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '10001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

function textToPixelMask(text: string): Set<string> {
  const mask = new Set<string>()
  let cursorX = 0
  for (const ch of text) {
    const glyph = GLYPHS[ch]
    if (!glyph) {
      cursorX += 3
      continue
    }
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === '1') mask.add(`${cursorX + col},${row}`)
      }
    }
    cursorX += 6 // 5 wide + 1 gap
  }
  return mask
}

// ── Contribution graph ──────────────────────────────────────────────────────

const CELL = 3
const GAP = 0.5
const COLS = 72
const ROWS = 40

const TEXT = '98.4K'
const TEXT_MASK = textToPixelMask(TEXT)
const TEXT_W = TEXT.length * 6 - 1
const TEXT_H = 7
// Position text toward the right
const TEXT_OFFSET_X = Math.floor(COLS * 0.56 - TEXT_W / 2)
const TEXT_OFFSET_Y = Math.floor((ROWS - TEXT_H) / 2)

const LEVELS_BG = [
  'hsl(var(--background-surface-300) / 0.2)',
  'hsl(var(--brand-400) / 0.08)',
  'hsl(var(--brand-500) / 0.1)',
  'hsl(var(--brand-600) / 0.12)',
  'hsl(var(--brand-default) / 0.12)',
]

const LEVELS_TEXT = [
  'hsl(var(--brand-600))',
  'hsl(var(--brand-default))',
  'hsl(var(--brand-default))',
  'hsl(var(--brand-600))',
  'hsl(var(--brand-500))',
]

function makeGrid(): { level: number; isText: boolean }[][] {
  let seed = 0x9e3779b9
  const rand = () => {
    seed ^= seed << 13
    seed ^= seed >> 17
    seed ^= seed << 5
    return (seed >>> 0) / 0xffffffff
  }
  return Array.from({ length: COLS }, (_, c) =>
    Array.from({ length: ROWS }, (_, r) => {
      const v = rand()
      const level = v < 0.45 ? 0 : v < 0.65 ? 1 : v < 0.8 ? 2 : v < 0.92 ? 3 : 4
      const localX = c - TEXT_OFFSET_X
      const localY = r - TEXT_OFFSET_Y
      const isText = TEXT_MASK.has(`${localX},${localY}`)
      return { level, isText }
    })
  )
}

const GRID = makeGrid()
const SVG_W = COLS * (CELL + GAP) - GAP
const SVG_H = ROWS * (CELL + GAP) - GAP

function ContribGraph() {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="xMaxYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {GRID.map((col, c) =>
        col.map(({ level, isText }, r) => (
          <rect
            key={`${c}-${r}`}
            x={c * (CELL + GAP)}
            y={r * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={1}
            fill={isText ? LEVELS_TEXT[level] : LEVELS_BG[level]}
            opacity={isInView ? 1 : 0}
            style={{
              transition: `opacity ${isText ? '0.6s' : '0.4s'} ease ${isText ? 0.3 + c * 0.015 : c * 0.02 + r * 0.01}s`,
            }}
          />
        ))
      )}
    </svg>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function OpenSourceSection() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  const starsNum = 98400

  return (
    <div className="border-b border-border overflow-hidden">
      <div className="relative py-24 flex flex-col justify-center">
        {/* Contrib graph background — right-aligned, radial fade */}
        <div
          className="absolute inset-y-0 left-1/4 right-[calc((100%-var(--container-max-w,75rem))/2*-1)]"
          style={{
            maskImage: 'radial-gradient(ellipse 55% 90% at 58% 50%, black 15%, transparent 60%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 55% 90% at 58% 50%, black 15%, transparent 60%)',
          }}
        >
          <ContribGraph />
        </div>

        <div className="relative z-10 w-full max-w-[var(--container-max-w,75rem)] mx-auto px-6">
          <div className="flex flex-col items-center text-center md:items-start md:text-left justify-between gap-6 py-10 max-w-lg md:max-w-lg mx-auto md:mx-0">
            <div>
              <h2 className="text-4xl text-foreground text-balance">Open source from day one</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground-lighter">
                Supabase is built in the open because we believe great developer tools should be
                transparent, inspectable, and owned by the community. Read, contribute, self-host.
                You&apos;re never locked in, and always in control.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                size="small"
                type="default"
                icon={
                  <svg viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.5 2.22168C5.23312 2.22168 2.58496 4.87398 2.58496 8.14677C2.58496 10.7642 4.27962 12.9853 6.63026 13.7684C6.92601 13.8228 7.03366 13.6401 7.03366 13.4827C7.03366 13.3425 7.02893 12.9693 7.02597 12.4754C5.38041 12.8333 5.0332 11.681 5.0332 11.681C4.76465 10.996 4.37663 10.8139 4.37663 10.8139C3.83954 10.4471 4.41744 10.4542 4.41744 10.4542C5.01072 10.4956 5.32303 11.0647 5.32303 11.0647C5.85065 11.9697 6.70774 11.7082 7.04431 11.5568C7.09873 11.1741 7.25134 10.9132 7.42051 10.7654C6.10737 10.6157 4.72621 10.107 4.72621 7.83683C4.72621 7.19031 4.95689 6.66092 5.33486 6.24686C5.27394 6.09721 5.07105 5.49447 5.39283 4.67938C5.39283 4.67938 5.88969 4.51967 7.01947 5.28626C7.502 5.15466 7.99985 5.08763 8.5 5.08692C9.00278 5.08929 9.50851 5.15495 9.98113 5.28626C11.1103 4.51967 11.606 4.67879 11.606 4.67879C11.9289 5.49447 11.7255 6.09721 11.6651 6.24686C12.0437 6.66092 12.2732 7.19031 12.2732 7.83683C12.2732 10.1129 10.8897 10.6139 9.5724 10.7606C9.78475 10.9434 9.97344 11.3048 9.97344 11.8579C9.97344 12.6493 9.96634 13.2887 9.96634 13.4827C9.96634 13.6413 10.0728 13.8258 10.3733 13.7678C11.5512 13.3728 12.5751 12.6175 13.3003 11.6089C14.0256 10.6002 14.4155 9.38912 14.415 8.14677C14.415 4.87398 11.7663 2.22168 8.5 2.22168Z"
                      fill="currentColor"
                    />
                  </svg>
                }
              >
                <Link
                  href="https://github.com/supabase"
                  target="_blank"
                  onClick={() => sendTelemetryEvent({ action: 'homepage_github_button_clicked' })}
                >
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
