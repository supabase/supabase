import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import Link from 'next/link'
import ShinyBox from '../ShinyBox'

const FeatureCard = ({
  classname,
  title,
  subtitle,
  image,
  url,
  onClick,
}: {
  title: string
  subtitle: string | React.ReactNode
  url: string
  image: any
  classname?: string
  onClick?: any
}) => (
  <LazyMotion features={domAnimation}>
    <Link href={url}>
      <a
        className={[
          'relative col-span-1 lg:col-span-4 h-[360px] md:h-[460px] flex flex-col gap-5 lg:flex-row',
          classname,
        ].join(' ')}
        onClick={onClick}
      >
        <ShinyBox
          outerClassName="relative w-full h-full group/2 shadow-lg p-0 dark:bg-scale-400 bg-scale-600 hover:!bg-brand-600"
          innerClassName="relative overflow-hidden flex-1 flex flex-col items-center gap-5 hover:!bg-brand-600 lg:items-start justify-between bg-scale-100
                  w-full rounded-xl h-full"
        >
          <m.div
            className={`relative flex-1 flex flex-col items-center gap-5 lg:items-start justify-between bg-scale-100
                  w-full rounded-xl h-full px-6 py-12`}
            initial="default"
            animate="default"
            whileHover="hover"
          >
            <dl className="relative z-10 flex flex-col items-center mx-auto text-center gap-2 text-scale-1200">
              <dt>
                <h2 className="text-xl">{title}</h2>
              </dt>
              <dd>
                <p className="text-sm text-scale-1000">{subtitle}</p>
              </dd>
            </dl>
            {image}
          </m.div>
        </ShinyBox>
      </a>
    </Link>
  </LazyMotion>
)

export default FeatureCard
