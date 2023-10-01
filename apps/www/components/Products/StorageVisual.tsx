import { range } from 'lodash'

import Icon from '@ui/components/Icon/Icon'

const columnIcons = ['Image', 'File', 'Video'] as const

const StorageVisual = () => (
  <figure
    role="img"
    className="absolute inset-0 overflow-hidden flex nowrap"
    aria-label="Supabase Storage supports images, documents and videos"
  >
    {range(0, 2).map((column, i) => (
      <div
        key={`SV-Index-${i}`}
        className="relative h-full left-0 w-auto items-end pb-2 z-10 flex pause animate-marquee group-hover:run will-change-transform transition-transform"
      >
        {range(0, 10).map((row, j) => (
          <div key={`SV-Index-${i}${j}`} className="flex flex-col ml-2 gap-2 md:gap-2">
            {columnIcons.map((icon, k) => (
              <div
                key={`SV-Index-${i}${j}${k}`}
                className="w-[60px] h-[60px] md:min-w-[62px] md:w-[62px] md:h-[62px] flex items-center justify-center rounded-lg border bg hover:border-brand"
              >
                <Icon
                  type={icon}
                  role="presentation"
                  className="w-6 h-6 md:w-6 md:h-6 text-muted"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    ))}
  </figure>
)

export default StorageVisual
