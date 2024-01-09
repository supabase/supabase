import React from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

const BackedBy = ({
  className,
  layout = 'vertical',
}: {
  className?: string
  layout?: 'horizontal' | 'vertical'
}) => {
  const { basePath } = useRouter()

  return (
    <div
      className={[
        'flex text-center gap-4 md:gap-2',
        layout === 'horizontal'
          ? 'flex-col lg:flex-row items-center justify-center'
          : 'flex-col items-center',
        className,
      ].join(' ')}
    >
      <small className="small text-xs">backed by</small>
      <div className="w-full sm:max-w-lg lg:ml-0">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 sm:flex-nowrap">
          <div className="relative h-6 w-6 sm:h-8">
            <Image
              src={`${basePath}/images/logos/yc--grey.png`}
              alt="Y Combinator"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div className="relative w-20 h-4 sm:h-5">
            <Image
              src={`${basePath}/images/logos/mozilla--grey.png`}
              alt="Mozilla"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div className="relative w-20 h-4 sm:h-5">
            <Image
              src={`${basePath}/images/logos/coatue.png`}
              alt="Coatue"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div className="relative w-20 h-5 sm:h-6">
            <Image
              src={`${basePath}/images/logos/felicis.png`}
              alt="Felicis"
              layout="fill"
              objectFit="contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackedBy
