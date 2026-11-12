/**
 * Maps an MCP Apps host's theme onto Studio's semantic color system.
 *
 * Studio's tokens are derived in OKLCH from a few inputs (`--surface`,
 * `--chroma`, `--foreground-lightness`…; see packages/ui/build/css/source/
 * semantic.css). Rather than restyling components per host, we set those inputs
 * from the host's own background and text colors, then pin the two anchors
 * exactly. Every `bg-surface-*`, `text-foreground-*` and `border-*` utility then
 * reads as part of the host while keeping Studio's relative steps.
 */

type HostVariables = Record<string, string | undefined>

const BACKGROUND_KEYS = ['--color-background-primary', '--color-background']
const TEXT_KEYS = ['--color-text-primary', '--color-foreground']
const BORDER_KEYS = ['--color-border-primary', '--color-border']
const FONT_KEYS = ['--font-sans', '--font-family-sans']
const MONO_KEYS = ['--font-mono', '--font-family-mono']

function first(variables: HostVariables, keys: string[]) {
  for (const key of keys) {
    const value = variables[key]?.trim()
    if (value) return value
  }
  return undefined
}

/** OKLCH lightness (0–1) of any CSS color the browser understands. */
export function cssColorLightness(color: string): number | undefined {
  if (typeof document === 'undefined') return undefined
  const probe = document.createElement('span')
  probe.style.color = color
  if (!probe.style.color) return undefined
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  const oklch = computed.match(/^oklch\(\s*([\d.]+)(%?)/)
  if (oklch) return Number(oklch[1]) / (oklch[2] ? 100 : 1)
  const rgb = computed.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
  if (!rgb) return undefined
  return srgbToOklchLightness(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]))
}

export function srgbToOklchLightness(r: number, g: number, b: number) {
  const linear = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995764 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

export function applyTheme(theme: 'light' | 'dark' | undefined) {
  const root = document.documentElement
  const resolved = theme ?? 'dark'
  root.dataset.theme = resolved
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
  root.style.colorScheme = resolved
}

export function applyHostVariables(variables: HostVariables | undefined) {
  if (!variables) return
  const root = document.documentElement.style
  // Keep the host's standard variables available as they are, for any rule
  // that reads them directly, before mapping the ones Studio's tokens use.
  for (const [key, value] of Object.entries(variables)) {
    if (key.startsWith('--') && value) root.setProperty(key, value)
  }
  const background = first(variables, BACKGROUND_KEYS)
  const text = first(variables, TEXT_KEYS)
  const surface = background ? cssColorLightness(background) : undefined
  const foreground = text ? cssColorLightness(text) : undefined
  if (background && surface !== undefined) {
    // Neutral hosts: drop Studio's green tint from the neutral ramp.
    root.setProperty('--surface', String(surface))
    root.setProperty('--chroma', '0')
    root.setProperty('--background', background)
  }
  if (text && foreground !== undefined) {
    root.setProperty('--foreground-lightness', String(foreground))
    root.setProperty('--foreground', text)
  }
  // Hairlines follow the host exactly; Studio's stronger borders keep their steps.
  const border = first(variables, BORDER_KEYS)
  if (border) root.setProperty('--border', border)
  const font = first(variables, FONT_KEYS)
  if (font) root.setProperty('--font-sans', font)
  const mono = first(variables, MONO_KEYS)
  if (mono) root.setProperty('--font-mono', mono)
}

/** Hosts may supply @font-face rules for their own fonts. */
export function applyHostFontCss(css: string | undefined) {
  if (!css) return
  const id = 'host-fonts'
  let style = document.getElementById(id)
  if (!style) {
    style = document.createElement('style')
    style.id = id
    document.head.appendChild(style)
  }
  style.textContent = css
}
