'use client'

import { animate, motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import { useSendTelemetryEvent } from '~/lib/telemetry'

// ── Contribution graph ──────────────────────────────────────────────────────

const CELL = 7
const GAP = 1
const COLS = 16
const ROWS = 12

const LEVELS = [
  'hsl(var(--background-surface-300))',
  'hsl(var(--brand-400))',
  'hsl(var(--brand-500))',
  'hsl(var(--brand-600))',
  'hsl(var(--brand-default))',
]

function makeGrid(): number[][] {
  let seed = 0x9e3779b9
  const rand = () => {
    seed ^= seed << 13
    seed ^= seed >> 17
    seed ^= seed << 5
    return (seed >>> 0) / 0xffffffff
  }
  return Array.from({ length: COLS }, () =>
    Array.from({ length: ROWS }, () => {
      const v = rand()
      return v < 0.45 ? 0 : v < 0.65 ? 1 : v < 0.8 ? 2 : v < 0.92 ? 3 : 4
    })
  )
}

const GRID = makeGrid()
const SVG_W = COLS * (CELL + GAP) - GAP
const SVG_H = ROWS * (CELL + GAP) - GAP

function ContribGraph({ inView }: { inView: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full opacity-70"
      aria-hidden
    >
      {GRID.map((col, c) =>
        col.map((level, r) => (
          <motion.rect
            key={`${c}-${r}`}
            x={c * (CELL + GAP)}
            y={r * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={2}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{
              delay: c * 0.02 + r * 0.007,
              type: 'spring',
              duration: 0.45,
              bounce: 0.15,
            }}
            style={{
              fill: LEVELS[level],
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}
          />
        ))
      )}
    </svg>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function OpenSourceSection() {
  const panelRef = useRef<HTMLDivElement>(null)
  const inView = useInView(panelRef, { once: true, amount: 0.4 })
  const sendTelemetryEvent = useSendTelemetryEvent()

  const [stars, setStars] = useState('0.0K')
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, 98400, {
      duration: 2.2,
      ease: 'easeOut',
      onUpdate: (v: number) => setStars(`${(v / 1000).toFixed(1)}K`),
    })
    return controls.stop
  }, [inView])

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] pl-6 border-x border-border">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Main content — spans 2 cols */}
          <div className="col-span-1 md:col-span-2 flex flex-col justify-center gap-6 py-24">
            <div>
              <h2 className="text-4xl text-foreground text-balance">Open source from day one</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground-lighter">
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

          <div
            ref={panelRef}
            className="relative flex flex-col items-start justify-end gap-2 overflow-hidden bg-surface-75 p-6 border-l border-border"
          >
            <ContribGraph inView={inView} />
            <div className="absolute inset-0 bg-gradient-to-t from-background from-15% via-background/50 via-60% to-transparent" />
            <span className="relative z-10 uppercase text-xs text-foreground-lighter">
              GitHub Stars
            </span>
            <span className="relative z-10 text-5xl font-bold text-foreground tabular-nums">
              {stars}
            </span>
            <span className="relative z-10 mt-1 text-xs text-foreground-lighter">
              Top 100 GitHub repos
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
