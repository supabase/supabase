import { startGlyphLines } from 'ui-patterns/GlyphLines/start-glyph-lines'

import { startFrameGlyphs } from './frame-glyphs'
import { startTopicShape } from './topic-shape'

// this runs outside react, so the first frame does not wait for the react dom download
export const startTopicHero = () => {
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>('[data-frame-glyphs]')) {
    startFrameGlyphs(canvas)
  }
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>('[data-topic-shape]')) {
    startTopicShape(canvas)
  }
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>('[data-hero-grid]')) {
    const svg = canvas.nextElementSibling
    const text = canvas.dataset.heroGrid
    if (!(svg instanceof SVGSVGElement) || !text) continue
    startGlyphLines({ canvas, linesRef: { current: svg }, text })
  }
}
