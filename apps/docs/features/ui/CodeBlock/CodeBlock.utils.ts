import { type CSSProperties } from 'react'

/*
 * As defined in @shikijs/core/dist/chunk-tokens.d.mts
 */
enum FontStyle {
  NotSet = -1,
  None = 0,
  Italic = 1,
  Bold = 2,
  Underline = 4,
}

export function getFontStyle(styleFlags: number): CSSProperties {
  let style: CSSProperties = {}

  if (styleFlags & FontStyle.Italic) {
    ;(style ??= {}).fontStyle = 'italic'
  }

  if (styleFlags & FontStyle.Bold) {
    ;(style ??= {}).fontWeight = 'bold'
  }

  if (styleFlags & FontStyle.Underline) {
    ;(style ??= {}).textDecoration = 'underline'
  }

  return style
}
