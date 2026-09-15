import * as z from 'zod'

export const TEXT_SIZE_OPTIONS = [
  { label: 'Small', value: 'small' },
  { label: 'Default', value: 'default' },
  { label: 'Large', value: 'large' },
] as const

const textSizeSchema = z.enum(['small', 'default', 'large'])

export type TextSize = z.infer<typeof textSizeSchema>

export function parseTextSize(value: unknown): TextSize {
  const parsed = textSizeSchema.safeParse(value)
  return parsed.success ? parsed.data : 'default'
}

export function applyTextSize(root: HTMLElement, textSize: TextSize) {
  root.dataset.textSize = textSize
}
