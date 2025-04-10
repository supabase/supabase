import { sampleSize } from 'lodash'

const colors = {
  brand: {
    bg: 'hsl(var(--brand-default))',
    hue: 'hsl(var(--brand-500))',
  },
  gray: {
    bg: 'hsl(var(--foreground-muted))',
    hue: 'hsl(var(--background-surface-100))',
  },
}

export const getRandomUniqueColor = (currentColors: string[]) => {
  const colorNames = Object.values(colors).map((col) => col.bg)
  const uniqueColors = colorNames.filter((color: string) => !currentColors.includes(color))
  const uniqueColor = uniqueColors[Math.floor(Math.random() * uniqueColors.length)]
  const uniqueColorSet = Object.values(colors).find((color) => color.bg === uniqueColor)
  return uniqueColorSet || getRandomColor()
}

export const getRandomColors = (qty: number) => {
  return sampleSize(Object.values(colors), qty)
}

export const getRandomColor = () => {
  return Object.values(colors)[Math.floor(Math.random() * Object.values(colors).length)]
}

export const getColor = (color: 'brand' | 'gray') => {
  return colors[color]
}
