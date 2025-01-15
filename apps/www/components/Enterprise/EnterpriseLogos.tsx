import React from 'react'
import { cn } from 'ui'

const logos = [
  {
    image: `/images/logos/publicity/github.svg`,
    alt: 'github',
    name: 'github',
  },
  {
    image: `/images/logos/publicity/mozilla.svg`,
    alt: 'mozilla',
    name: 'mozilla',
  },
  {
    image: `/images/logos/publicity/1password.svg`,
    alt: '1password',
    name: '1password',
  },
  {
    image: `/images/logos/publicity/pwc.svg`,
    alt: 'pwc',
    name: 'pwc',
  },
  {
    image: `/images/logos/publicity/langchain.svg`,
    alt: 'langchain',
    name: 'langchain',
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
              md:h-12 md:!min-h-12
              lg:h-11 lg:!min-h-11
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
