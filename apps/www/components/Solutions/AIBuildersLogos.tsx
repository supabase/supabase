import Link from 'next/link'
import React from 'react'
import { cn } from 'ui'

const logos = [
  {
    image: `/images/logos/publicity/lovable.svg`,
    alt: 'lovable',
    name: 'lovable',
    href: 'https://lovable.dev/',
  },
  {
    image: `/images/logos/publicity/bolt.svg`,
    alt: 'bolt',
    name: 'bolt',
    href: 'https://bolt.new',
  },
  {
    image: `/images/logos/publicity/v0.svg`,
    alt: 'v0',
    name: 'v0',
    href: 'https://v0.dev',
  },
  {
    image: `/images/logos/publicity/figma.svg`,
    alt: 'figma',
    name: 'figma',
    href: 'https://www.figma.com/make/',
  },
  {
    image: `/images/logos/publicity/tempo.svg`,
    alt: 'tempo',
    name: 'tempo',
    href: 'https://tempo.new',
  },
  {
    image: `/images/logos/publicity/gumloop.svg`,
    alt: 'gumloop',
    name: 'gumloop',
    href: 'https://gumloop.com',
  },
  {
    image: `/images/logos/publicity/co-com.svg`,
    alt: 'co.com',
    name: 'co-com',
    href: 'https://co.dev',
  },
]

interface Props {
  className?: string
}

const EnterpriseLogos: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex lg:grid grid-cols-2 xl:flex flex-nowrap gap-4 md:gap-8 lg:gap-4 2xl:gap-4',
        className
      )}
    >
      {logos.map((logo) => (
        <Link
          href={logo.href}
          target="_blank"
          key={`ent-logo-${logo.name}`}
          className="h-12 lg:h-12 w-max hover:opacity-100 opacity-80 transition-opacity"
        >
          <img
            src={logo.image}
            alt={logo.alt}
            className="
              w-auto block
              h-10 !min-h-10
              md:h-10 md:!min-h-10
              lg:h-7 lg:!min-h-7
              2xl:h-10 2xl:!min-h-10
            "
            draggable={false}
          />
        </Link>
      ))}
    </div>
  )
}

export default EnterpriseLogos
