import React from 'react'
import Image from 'next/image'
import { range } from 'lib/helpers'
import { cn } from 'ui'

interface Props {
  className?: string
}

const DataAPIsVisual: React.FC<Props> = ({ className }) => (
  <figure className={cn('absolute inset-0 overflow-hidden', className)}>
    <div className="absolute z-0 inset-0 flex flex-nowrap">
      {range(0, 3).map((_, idx1: number) => (
        <div
          key={`row-${idx1}`}
          className="relative h-full !aspect-[330/430] xl:!aspect-[305/450] 2xl:!aspect-[340/445] -right-10 -left-10 items-end pb-2 z-10 flex pause animate-[marquee-reverse_30000ms_linear_both_infinite] motion-safe:group-hover:run will-change-transform"
        >
          <Image
            draggable={false}
            src="/images/index/products/data-apis-lines-dark.svg"
            alt="Supabase restful DataAPIs"
            width={330}
            height={430}
            quality={100}
            className="hidden dark:block !h-full object-contain !aspect-[330/430]"
          />
          <Image
            draggable={false}
            src="/images/index/products/data-apis-lines-light.svg"
            alt="Supabase restful DataAPIs"
            width={330}
            height={430}
            quality={100}
            className="dark:block !h-full !aspect-[330/430] not-sr-only"
          />
        </div>
      ))}
      <Image
        draggable={false}
        src="/images/index/products/data-apis-dark.svg"
        alt="Supabase restful DataAPIs"
        fill
        sizes="100%"
        quality={100}
        className="hidden dark:block absolute !h-full aspect-[330/430] inset-0 z-10 object-contain -mt-1.5 object-center bottom-0"
      />
      <Image
        draggable={false}
        src="/images/index/products/data-apis-light.svg"
        alt="Supabase restful DataAPIs"
        fill
        sizes="100%"
        quality={100}
        className="dark:hidden absolute h-full aspect-[330/430] inset-0 z-10 object-contain -mt-1.5 object-center bottom-0"
      />
    </div>
  </figure>
)

export default DataAPIsVisual
