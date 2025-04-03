import React from 'react'
import { cn } from 'ui'

const logos = [
  {
    image: `/images/logos/publicity/v0.svg`,
    alt: 'v0',
    name: 'v0',
  },
  {
    image: `/images/logos/publicity/bolt.svg`,
    alt: 'bolt',
    name: 'bolt',
  },
  {
    image: `/images/logos/publicity/lovable.svg`,
    alt: 'lovable',
    name: 'lovable',
  },
  {
    image: `/images/logos/publicity/tempo-labs.svg`,
    alt: 'tempo labs',
    name: 'tempo-labs',
  },
  {
    image: `/images/logos/publicity/co-com.svg`,
    alt: 'co.com',
    name: 'co-com',
  },
  {
    image: `/images/logos/publicity/gumloop.svg`,
    alt: 'gumloop',
    name: 'gumloop',
  },
]

interface Props {
  className?: string
}

const EnterpriseLogos: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex lg:grid grid-cols-2 xl:flex flex-nowrap gap-4 md:gap-8 lg:gap-4 2xl:gap-8',
        className
      )}
      suppressHydrationWarning
    >
      {logos.map((logo) => (
        <div key={`ent-logo-${logo.name}`} className="h-12 lg:h-12 w-max">
          <img
            src={logo.image}
            alt={logo.alt}
            className="
              w-auto block
              h-10 !min-h-10
              md:h-10 md:!min-h-10
              lg:h-7 lg:!min-h-7
              2xl:h-12 2xl:!min-h-12
            "
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}

export default EnterpriseLogos
