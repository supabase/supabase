'use client'

import {
  Archive,
  BarChart3,
  Box,
  Cable,
  Cloud,
  Code,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  Folder,
  GitBranch,
  HardDrive,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  MousePointerClick,
  Package2,
  Server,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Terminal,
  Webhook,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { memo, useEffect, useMemo, useRef } from 'react'

const icons: LucideIcon[] = [
  Database,
  Cloud,
  Zap,
  Shield,
  KeyRound,
  BarChart3,
  Lock,
  Server,
  Cpu,
  CreditCard,
  Box,
  GitBranch,
  Terminal,
  Code,
  Webhook,
  Mail,
  Settings,
  CreditCard,
  FileText,
  ShieldCheck,
  MessageSquare,
  Cable,
  Package2,
  HardDrive,
  Folder,
  Archive,
  Fingerprint,
  Share2,
  Database,
  MousePointerClick,
]

interface TileProps {
  icon: LucideIcon
  index: number
}

const Tile = memo(function Tile({ icon: Icon, index }: TileProps) {
  return (
    <div
      data-tile-index={index}
      className="group relative flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 border transition-all duration-500 ease-out data-[active=true]:bg-brand-400 data-[active=true]:border-brand/80"
      style={{
        opacity: 0.5,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <Icon
        className="h-4 w-4 transition-all duration-500 text-muted-foreground/60 group-data-[active=true]:text-brand/80"
        style={{ opacity: 0.6 }}
        strokeWidth={1.5}
      />
    </div>
  )
})

export function IntegrationTileGrid() {
  const gridRef = useRef<HTMLDivElement>(null)
  const tileElsRef = useRef<HTMLElement[]>([])

  const cols = 50
  const rows = 12

  const tiles = useMemo(() => {
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => {
        const iconIndex = (row * cols + col) % icons.length
        return {
          icon: icons[iconIndex],
          key: `${row}-${col}`,
          index: row * cols + col,
        }
      })
    )
  }, [])

  useEffect(() => {
    if (!gridRef.current) return

    tileElsRef.current = Array.from(
      gridRef.current.querySelectorAll('[data-tile-index]')
    ) as HTMLElement[]

    let activationTimeout: ReturnType<typeof setTimeout>
    let isMounted = true

    function activate() {
      if (!isMounted || !tileElsRef.current.length) return

      const idx = Math.floor(Math.random() * tileElsRef.current.length)
      const el = tileElsRef.current[idx]
      const svg = el?.firstElementChild as SVGElement | null
      if (!el) return

      el.dataset.active = 'true'
      el.style.opacity = '1'
      el.style.transform = 'scale(1.05)'
      el.style.boxShadow = '0 0 8px rgba(62,207,142,0.25), 0 1px 2px rgba(0,0,0,0.3)'
      if (svg) svg.style.opacity = '1'

      setTimeout(
        () => {
          if (!isMounted) return
          delete el.dataset.active
          el.style.opacity = '0.5'
          el.style.transform = 'scale(1)'
          el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
          if (svg) svg.style.opacity = '0.6'
        },
        4000 + Math.random() * 800
      )

      activationTimeout = setTimeout(activate, 400 + Math.random() * 400)
    }

    activationTimeout = setTimeout(activate, 400)

    return () => {
      isMounted = false
      clearTimeout(activationTimeout)
    }
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-background via-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-background via-transparent to-transparent" />
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-linear-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-linear-to-l from-background to-transparent" />

      {/* Tile grid */}
      <div ref={gridRef} className="relative flex flex-col gap-2">
        {tiles.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((tile) => (
              <Tile key={tile.key} icon={tile.icon} index={tile.index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
