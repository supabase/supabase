import { cn } from 'ui'

import { BLOCK_GLYPHS } from '../lib/ascii/field'

export interface AsciiHoverTextProps {
  text: string
  glyphClassName: string
  className?: string
}

const toCharacters = (text: string) =>
  Array.from(text).map((char, position) => ({
    id: `${position}:${char}`,
    char,
    glyph: BLOCK_GLYPHS[(position * 7) % BLOCK_GLYPHS.length],
  }))

export const AsciiHoverText = ({ text, glyphClassName, className }: AsciiHoverTextProps) => (
  <span className={className}>
    <span className="sr-only">{text}</span>
    <span aria-hidden>
      {toCharacters(text).map(({ id, char, glyph }) =>
        char === ' ' ? (
          ' '
        ) : (
          <span
            key={id}
            data-glyph={glyph}
            className={cn(
              'relative',
              'after:pointer-events-none after:absolute after:inset-0 after:flex after:items-center after:justify-center',
              'after:font-mono after:text-[0.72em] after:leading-none after:opacity-0',
              'after:content-[attr(data-glyph)]',
              'hover:text-transparent hover:after:opacity-100',
              '[:hover+&]:text-transparent [:hover+&]:after:opacity-60 [:hover+&]:after:content-["░"]',
              '[&:has(+:hover)]:text-transparent [&:has(+:hover)]:after:opacity-60 [&:has(+:hover)]:after:content-["░"]',
              glyphClassName
            )}
          >
            {char}
          </span>
        )
      )}
    </span>
  </span>
)
