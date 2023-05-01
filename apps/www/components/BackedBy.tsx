import React from 'react'
import { useRouter } from 'next/router'

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
        'flex text-center',
        layout === 'horizontal'
          ? 'flex-col lg:flex-row items-center justify-center'
          : 'flex-col items-center',
        className,
      ].join(' ')}
    >
      <small className="small text-xs">backed by</small>
      <div className="w-full sm:max-w-lg mt-4 md:mt-3 lg:ml-0">
        <div className="flex flex-wrap items-center justify-center gap-y-8 sm:flex-nowrap">
          <img
            className="h-8 pr-5 sm:h-8 md:pr-10"
            src={`${basePath}/images/logos/yc--grey.png`}
            alt="Y Combinator"
          />
          <img
            className="relative h-5 pr-5 sm:h-5 md:pr-10"
            src={`${basePath}/images/logos/mozilla--grey.png`}
            alt="Mozilla"
          />
          <img
            className="relative h-5 pr-5 sm:h-5 md:pr-10"
            src={`${basePath}/images/logos/coatue.png`}
            alt="Coatue"
          />
          <img
            className="relative h-6 sm:h-6"
            src={`${basePath}/images/logos/felicis.png`}
            alt="Felicis"
          />
        </div>
      </div>
    </div>
  )
}

export default BackedBy
