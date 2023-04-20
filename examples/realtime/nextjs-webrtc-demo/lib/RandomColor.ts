import sampleSize from 'lodash.samplesize'
import { Mic, MoreVertical, Phone } from 'lucide-react'

const colors = {
  tomato: {
    bg: 'bg-red-100/10',
    'bg-strong': 'bg-red-500',
    border: 'border-red-500',
    icon: 'mic',
    text: 'text-red-500',
  },
  crimson: {
    bg: 'bg-rose-100/10',
    'bg-strong': 'bg-rose-500',
    border: 'border-rose-500',
    icon: 'mic',
    text: 'text-rose-500',
  },
  pink: {
    bg: 'bg-pink-100/10',
    'bg-strong': 'bg-pink-500',
    border: 'border-pink-500',
    icon: 'mic',
    text: 'text-pink-500',
  },
  plum: {
    bg: 'bg-violet-100/10',
    'bg-strong': 'bg-violet-500',
    border: 'border-violet-500',
    icon: 'mic',
    text: 'text-violet-500',
  },
  indigo: {
    bg: 'bg-indigo-100/10',
    'bg-strong': 'bg-indigo-500',
    border: 'border-indigo-500',
    icon: 'mic',
    text: 'text-indigo-500',
  },
  blue: {
    bg: 'bg-blue-100/10',
    'bg-strong': 'bg-blue-500',
    border: 'border-blue-500',
    icon: 'mic',
    text: 'text-blue-500',
  },
  cyan: {
    bg: 'bg-cyan-100/10',
    'bg-strong': 'bg-cyan-500',
    border: 'border-cyan-500',
    icon: 'mic',
    text: 'text-cyan-500',
  },
  green: {
    bg: 'bg-green-100/10',
    'bg-strong': 'bg-green-500',
    border: 'border-green-500',
    icon: 'mic',
    text: 'text-green-500',
  },
  orange: {
    bg: 'bg-orange-100/10',
    'bg-strong': 'bg-orange-500',
    border: 'border-orange-500',
    icon: 'mic',
    text: 'text-orange-500',
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
