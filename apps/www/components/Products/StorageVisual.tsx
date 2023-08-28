import React from 'react'
import { range } from 'lodash'
import { IconFile, IconImage, IconVideo } from 'ui'

const StorageVisual = () => {
  const cols = [
    <IconImage className="w-6 h-6 md:w-4 md:h-4" />,
    <IconFile className="w-6 h-6 md:w-4 md:h-4" />,
    <IconVideo className="w-6 h-6 md:w-4 md:h-4" />,
  ]

  return (
    <div className="absolute inset-0 overflow-hidden flex nowrap">
      {range(0, 2).map((_rangeCol) => (
        <div className="relative h-full left-0 w-auto items-end pb-2 z-10 flex pause animate-marquee group-hover:run will-change-transform transition-transform">
          {range(0, 10).map((_rangeCol) => (
            <div className="flex flex-col ml-2 gap-2 md:gap-2">
              {cols.map((col: any) => (
                <div className="w-[60px] h-[60px] md:min-w-14 md:w-14 md:h-14 flex items-center justify-center rounded-lg border bg-alternative hover:border-brand">
                  {col}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default StorageVisual
