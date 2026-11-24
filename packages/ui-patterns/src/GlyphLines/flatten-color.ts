interface FlattenColorParams {
  color: string
  surface: string
}

const flattenedColors = new Map<string, string>()

// border tokens have alpha, and alpha adds up where glyphs overlap. so glyphs draw in the opaque color the token gives over the surface
export const flattenColor = ({ color, surface }: FlattenColorParams): string => {
  if (color === surface) return color
  const key = `${color}|${surface}`
  const cached = flattenedColors.get(key)
  if (cached) return cached
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!probe) return color
  probe.canvas.width = 1
  probe.canvas.height = 1
  probe.fillStyle = surface
  probe.fillRect(0, 0, 1, 1)
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data
  const flattened = `rgb(${red} ${green} ${blue})`
  flattenedColors.set(key, flattened)
  return flattened
}
