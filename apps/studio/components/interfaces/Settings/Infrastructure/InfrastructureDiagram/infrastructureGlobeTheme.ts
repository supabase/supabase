import { useMemo } from 'react'

export type InfrastructureGlobeThemeColors = {
  dark: number
  baseColor: [number, number, number]
  glowColor: [number, number, number]
  markers: {
    primary: [number, number, number]
    replica: [number, number, number]
    recommended: [number, number, number]
  }
}

const FALLBACK_LIGHT: InfrastructureGlobeThemeColors = {
  dark: 0,
  baseColor: [1, 1, 1],
  glowColor: [0.96, 0.96, 0.96],
  markers: {
    primary: [0.1, 0.1, 0.1],
    replica: [0.1, 0.1, 0.1],
    recommended: [0.96, 0.65, 0.14],
  },
}

const FALLBACK_DARK: InfrastructureGlobeThemeColors = {
  dark: 1,
  baseColor: [0.12, 0.12, 0.14],
  glowColor: [0.18, 0.18, 0.2],
  markers: {
    primary: [0.92, 0.92, 0.92],
    replica: [0.92, 0.92, 0.92],
    recommended: [0.98, 0.72, 0.22],
  },
}

const parseRgbToUnit = (rgb: string): [number, number, number] | null => {
  if (rgb === 'transparent') return null

  const channels = rgb.match(/[\d.]+/g)?.map(Number)
  if (!channels || channels.length < 3) return null
  if (channels.length >= 4 && channels[3] === 0) return null

  return [channels[0] / 255, channels[1] / 255, channels[2] / 255]
}

/** Tailwind color utilities need a sized element or getComputedStyle returns transparent. */
const readTailwindColorRgb = (
  className: string,
  property: 'backgroundColor' | 'color'
): [number, number, number] | null => {
  if (typeof document === 'undefined') return null

  const element = document.createElement('div')
  element.className = `size-4 shrink-0 ${className}`
  element.style.position = 'absolute'
  element.style.visibility = 'hidden'
  element.style.pointerEvents = 'none'
  document.body.appendChild(element)

  const value = getComputedStyle(element)[property]
  document.body.removeChild(element)

  return parseRgbToUnit(value)
}

export const readInfrastructureGlobeThemeColors = (
  isDark: boolean
): InfrastructureGlobeThemeColors => {
  const fallback = isDark ? FALLBACK_DARK : FALLBACK_LIGHT

  if (typeof document === 'undefined') return fallback

  const baseColor = readTailwindColorRgb('bg-background', 'backgroundColor')
  const glowColor = readTailwindColorRgb('bg-muted', 'backgroundColor')
  const primary = readTailwindColorRgb('text-foreground', 'color')
  const replica = readTailwindColorRgb('text-foreground', 'color')
  const recommended = readTailwindColorRgb('bg-warning', 'backgroundColor')

  return {
    dark: isDark ? 1 : 0,
    baseColor: baseColor ?? fallback.baseColor,
    glowColor: glowColor ?? fallback.glowColor,
    markers: {
      primary: primary ?? fallback.markers.primary,
      replica: replica ?? fallback.markers.replica,
      recommended: recommended ?? fallback.markers.recommended,
    },
  }
}

export const useInfrastructureGlobeTheme = (isDark: boolean) =>
  useMemo(() => readInfrastructureGlobeThemeColors(isDark), [isDark])
