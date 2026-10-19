import { cn } from 'ui'

import { hash, RAMP } from '../lib/ascii/field'

export interface AsciiHoverTextProps {
  text: string
  glyphClassName: string
  className?: string
}

export const AsciiHoverText = ({ text, glyphClassName, className }: AsciiHoverTextProps) => {
  const characters = Array.from(text).map((char, position) => ({
    id: `${position}:${char}`,
    char,
    glyph: RAMP[1 + Math.floor(hash(position, char.charCodeAt(0)) * (RAMP.length - 1))],
  }))

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {characters.map(({ id, char, glyph }) =>
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
}
