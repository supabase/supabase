'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useInView } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'

interface GitHubContributor {
  id: number
  login: string
  avatar_url: string
  contributions: number
}

interface AvatarPosition {
  id: number
  login: string
  avatar_url: string
  x: number
  y: number
  size: number
  opacity: number
  delay: number
}

function useContributors() {
  const [contributors, setContributors] = useState<GitHubContributor[]>([])

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      try {
        const pages = await Promise.all(
          [1, 2].map((page) =>
            fetch(
              `https://api.github.com/repos/supabase/supabase/contributors?per_page=100&page=${page}`,
              { headers: { Accept: 'application/vnd.github.v3+json' } }
            ).then((r) => (r.ok ? r.json() : []))
          )
        )
        if (!cancelled) setContributors(pages.flat())
      } catch {
        // silent fail
      }
    }
    fetchAll()
    return () => {
      cancelled = true
    }
  }, [])

  return contributors
}

function AvatarCloud({ contributors }: { contributors: GitHubContributor[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.4 })
  const [positions, setPositions] = useState<AvatarPosition[]>([])

  useEffect(() => {
    if (contributors.length === 0 || !containerRef.current) return

    const generate = () => {
      const width = containerRef.current!.clientWidth
      const avatarSize = 28
      const gap = 6
      const cols = Math.ceil(width / (avatarSize + gap))
      const rows = 10

      const centerX = cols / 2
      const centerY = -3
      const radiusX = cols * 0.35
      const radiusY = rows * 0.8

      const result: AvatarPosition[] = []
      let ci = 0

      for (let row = 0; row < rows; row++) {
        const rowOffset = row % 2 === 0 ? 0 : (avatarSize + gap) / 2
        for (let col = 0; col < cols; col++) {
          const dx = (col - centerX) / radiusX
          const dy = (row - centerY) / radiusY
          if (dx * dx + dy * dy < 1) continue
          if (Math.random() > 0.82) continue

          const c = contributors[ci % contributors.length]
          ci++

          const edgeDistX = Math.min(col, cols - col - 1) / (cols * 0.12)
          const edgeDistY = row / (rows * 0.3)
          const edgeFade = Math.min(1, edgeDistX, edgeDistY)

          result.push({
            id: c.id,
            login: c.login,
            avatar_url: c.avatar_url,
            x: col * (avatarSize + gap) + rowOffset + (Math.random() - 0.5) * 6,
            y: row * (avatarSize + gap) + (Math.random() - 0.5) * 6,
            size: 24 + Math.random() * 8,
            opacity: Math.min(0.85, edgeFade * (0.35 + Math.random() * 0.5)),
            delay: Math.random() * 2,
          })
        }
      }

      setPositions(result)
    }

    generate()

    const onResize = () => generate()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [contributors])

  return (
    <div ref={containerRef} className="absolute inset-x-0 bottom-0 h-[340px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent z-10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
      <div className="relative w-full h-full">
        {positions.map((pos, i) => (
          <div
            key={`${pos.id}-${i}`}
            className="absolute transition-opacity duration-1000 ease-out"
            style={{
              left: pos.x,
              top: pos.y,
              width: pos.size,
              height: pos.size,
              opacity: inView ? pos.opacity : 0,
              transitionDelay: `${pos.delay}s`,
            }}
          >
            <img
              src={pos.avatar_url}
              alt={pos.login}
              width={pos.size}
              height={pos.size}
              className="rounded-md border border-foreground/10 grayscale pointer-events-none"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CTASection() {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const contributors = useContributors()

  return (
    <div className="relative overflow-hidden py-32">
      {/*<AvatarCloud contributors={contributors} />*/}
      <div className="relative z-20 flex flex-col items-center text-center gap-6">
        <h2 className="h2">
          <span className="text-foreground-lighter">Build in a weekend,</span>
          <span className="text-foreground block sm:inline"> scale to millions</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button asChild size="medium">
            <Link
              href="https://supabase.com/dashboard"
              onClick={() =>
                sendTelemetryEvent({
                  action: 'start_project_button_clicked',
                  properties: { buttonLocation: 'CTA Banner' },
                })
              }
            >
              Start your project
            </Link>
          </Button>
          <Button asChild size="medium" type="default">
            <Link
              href="/contact/sales"
              onClick={() =>
                sendTelemetryEvent({
                  action: 'request_demo_button_clicked',
                  properties: { buttonLocation: 'CTA Banner' },
                })
              }
            >
              Request a demo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
