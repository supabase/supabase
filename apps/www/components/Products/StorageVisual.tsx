import React from 'react'
import { range } from 'lodash'
import { IconFile, IconImage, IconVideo } from 'ui'

const StorageVisual = () => {
  const cols = [
    <IconImage className="w-6 h-6 md:w-6 md:h-6 text-muted" />,
    <IconFile className="w-6 h-6 md:w-6 md:h-6 text-muted" />,
    <IconVideo className="w-6 h-6 md:w-6 md:h-6 text-muted" />,
  ]

  return (
    <figure
      className="absolute inset-0 overflow-hidden flex nowrap"
      role="img"
      aria-label="Supabase Storage supports images, documents and videos"
    >
      {range(0, 2).map((_, idx1: number) => (
        <div
          key={`row-${idx1}`}
          className="relative h-full left-0 w-auto items-end pb-2 z-10 flex pause animate-marquee group-hover:run will-change-transform transition-transform"
        >
          {range(0, 10).map((_, idx2: number) => (
            <div key={`col-${idx2}`} className="flex flex-col ml-2 gap-2 md:gap-2">
              {cols.map((col: any, idx3: number) => (
                <div
                  key={`icon-${idx3}`}
                  className="w-[60px] h-[60px] md:min-w-[62px] md:w-[62px] md:h-[62px] flex items-center justify-center rounded-lg border bg hover:border-brand"
                >
                  {col}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </figure>
  )
}

export default StorageVisual
