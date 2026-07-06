'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import './surveyResults.css'

interface Participant {
  company: string
  url: string
}

const ROW_COUNT = 5
const ROW_DURATIONS_SECONDS = [320, 380, 280, 440, 340]

function chunkIntoRows<T>(items: T[], rowCount: number): T[][] {
  const rows: T[][] = Array.from({ length: rowCount }, () => [])
  items.forEach((item, index) => {
    rows[index % rowCount].push(item)
  })
  return rows
}

function shuffleSeeded<T>(items: T[], seed: number): T[] {
  // Deterministic shuffle so SSR and client agree.
  const copy = [...items]
  let state = seed
  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 9301 + 49297) % 233280
    const j = Math.floor((state / 233280) * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function ParticipantsCarousel({ participants }: { participants: Participant[] }) {
  const rows = useMemo(() => {
    const shuffled = shuffleSeeded(participants, 1)
    return chunkIntoRows(shuffled, ROW_COUNT)
  }, [participants])

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6">
      {rows.map((row, rowIndex) => {
        if (row.length === 0) return null
        const duration = ROW_DURATIONS_SECONDS[rowIndex % ROW_DURATIONS_SECONDS.length]
        const reverse = rowIndex % 2 === 1
        // Duplicate so the loop is seamless: translateX(-50%) lands the start of
        // the second copy exactly where the first started.
        const loop = [...row, ...row]
        return (
          <div
            key={rowIndex}
            className="marquee-row group relative w-full overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
            }}
          >
            <ul
              className={`marquee-track${reverse ? ' marquee-track--reverse' : ''} flex w-max items-center gap-5 md:gap-7`}
              style={{ animationDuration: `${duration}s` }}
            >
              {loop.map((participant, index) => (
                <li key={`${rowIndex}-${index}-${participant.company}`} className="shrink-0">
                  <Link
                    href={participant.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm font-mono tracking-widest uppercase text-foreground-lighter hover:text-brand-link transition-colors whitespace-nowrap"
                  >
                    {participant.company}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
