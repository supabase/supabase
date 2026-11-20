import { Fragment } from 'react'
import { cn } from 'ui'

import { ASCII_HOVER_CLASS, hoverGlyph } from './AsciiHoverText'

export interface InfallTextProps {
  text: string
  hoverGlyphClassName?: string
  className?: string
}

export const InfallText = ({ text, hoverGlyphClassName, className }: InfallTextProps) => {
  const words = text.split(' ').map((word, position) => ({
    id: `${position}:${word}`,
    isFirst: position === 0,
    characters: Array.from(word).map((char, index) => ({
      id: `${index}:${char}`,
      char,
      // the word index times 64 gives each character its own glyph seed
      glyph: hoverGlyph(position * 64 + index, char),
    })),
  }))

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map(({ id, isFirst, characters }) => (
          <Fragment key={id}>
            {isFirst ? null : ' '}
            <span className="whitespace-nowrap">
              {characters.map((character) => (
                <span
                  key={character.id}
                  data-infall
                  data-glyph={hoverGlyphClassName === undefined ? undefined : character.glyph}
                  className={cn(
                    'relative inline-block',
                    hoverGlyphClassName === undefined
                      ? null
                      : [ASCII_HOVER_CLASS, hoverGlyphClassName]
                  )}
                >
                  <span>{character.char}</span>
                  <span
                    className={cn(
                      'absolute inset-0 flex items-center justify-center',
                      'scale-60 font-mono leading-none opacity-0'
                    )}
                  >
                    ▒
                  </span>
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  )
}
