import React from 'react'
import Image from 'next/image'
import { range } from 'lodash'
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
          className="relative h-full !aspect-[330/430] -right-10 -left-10 items-end pb-2 z-10 flex pause animate-[marquee-reverse_30000ms_linear_both_infinite] motion-safe:group-hover:run will-change-transform"
        >
          <Image
            src="/images/index/products/data-apis-lines-dark.svg"
            alt="Supabase restful DataAPIs"
            fill
            sizes="100%"
            quality={100}
            className="hidden dark:block !h-full !aspect-[330/430]"
          />
          <Image
            src="/images/index/products/data-apis-lines-light.svg"
            alt="Supabase restful DataAPIs"
            fill
            sizes="100%"
            quality={100}
            className="dark:block !h-full !aspect-[330/430]"
          />
        </div>
      ))}
      <Image
        src="/images/index/products/data-apis-dark.svg"
        alt="Supabase restful DataAPIs"
        fill
        sizes="100%"
        quality={100}
        className="hidden dark:block absolute h-full aspect-[330/430] inset-0 z-10 object-contain xl:object-cover 2xl:object-contain object-center bottom-0"
      />
      <Image
        src="/images/index/products/data-apis-light.svg"
        alt="Supabase restful DataAPIs"
        fill
        sizes="100%"
        quality={100}
        className="dark:hidden absolute h-full aspect-[330/430] inset-0 z-10 object-contain xl:object-cover 2xl:object-contain object-center bottom-0"
      />
    </div>
  </figure>
)

export default DataAPIsVisual
