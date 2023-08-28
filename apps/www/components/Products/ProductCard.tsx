import React from 'react'
import Link from 'next/link'
import Panel from '~/components/Panel'

const ProductCard = ({
  className,
  title,
  subtitle,
  highlights,
  icon,
  image,
  url,
  onClick,
  alignLeft = false,
}: {
  title: string
  subtitle: string | React.ReactNode
  highlights?: string | React.ReactNode
  url: string
  icon?: string
  image: any
  className?: string
  onClick?: any
  alignLeft?: boolean
}) => (
  <Link href={url}>
    <a
      className={[
        'group relative w-full aspect-square sm:aspect-auto sm:h-[400px] flex flex-col gap-5 lg:flex-row focus:outline-none focus:border-none focus:ring-brand-600 focus:ring-2 focus:rounded-xl',
        className,
      ].join(' ')}
      onClick={onClick}
    >
      <Panel
        // hasShimmer
        hasActiveOnHover
        outerClassName="relative w-full h-full shadow-lg p-0"
        innerClassName="relative overflow-hidden flex-1 flex flex-col items-center gap-5 lg:items-start justify-between w-full rounded-xl h-full bg"
      >
        <div
          className={[
            `relative flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                  w-full rounded-xl h-full px-6 py-8`,
            alignLeft && 'lg:px-8',
          ].join(' ')}
        >
          <dl
            className={[
              'relative z-10 flex flex-col lg:h-full gap-2 text-scale-1200 mx-auto items-center text-center',
              alignLeft && 'lg:mx-0 lg:items-start lg:text-left lg:max-w-[200px]',
            ].join(' ')}
          >
            <div className="flex items-center justify-center h-12 w-12 bg-alternative rounded-lg">
              {icon && (
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 25 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d={icon}
                    stroke="var(--colors-brand9)"
                    strokeMiterlimit="10"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </div>
            <dt>
              <h2 className="text-xl">{title}</h2>
            </dt>
            <dd className="flex-1 flex flex-col justify-between gap-2">
              <p className="text-sm text-scale-1000">{subtitle}</p>
              {highlights && <div className="hidden lg:block">{highlights}</div>}
            </dd>
          </dl>
          {image}
        </div>
      </Panel>
    </a>
  </Link>
)

export default ProductCard
