import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import Link from 'next/link'

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
        <m.div
          className={`relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between bg-scale-100
                  w-full border dark:border-scale-300 border-scale-600 hover:border-brand-900 hover:dark:border-brand-700 rounded-xl h-full px-6 py-12 shadow-lg`}
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
      </a>
    </Link>
  </LazyMotion>
)

export default FeatureCard
