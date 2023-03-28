import sampleSize from 'lodash.samplesize'

const colors = {
  tomato: {
    bg: 'var(--colors-tomato9)',
    hue: 'var(--colors-tomato7)',
  },
  crimson: {
    bg: 'var(--colors-crimson9)',
    hue: 'var(--colors-crimson7)',
  },
  pink: {
    bg: 'var(--colors-pink9)',
    hue: 'var(--colors-pink7)',
  },
  plum: {
    bg: 'var(--colors-plum9)',
    hue: 'var(--colors-plum7)',
  },
  indigo: {
    bg: 'var(--colors-indigo9)',
    hue: 'var(--colors-indigo7)',
  },
  blue: {
    bg: 'var(--colors-blue9)',
    hue: 'var(--colors-blue7)',
  },
  cyan: {
    bg: 'var(--colors-cyan9)',
    hue: 'var(--colors-cyan7)',
  },
  green: {
    bg: 'var(--colors-green9)',
    hue: 'var(--colors-green7)',
  },
  orange: {
    bg: 'var(--colors-orange9)',
    hue: 'var(--colors-orange7)',
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
