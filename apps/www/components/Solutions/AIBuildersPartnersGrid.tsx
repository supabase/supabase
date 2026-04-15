import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface Partner {
  name: string
  href: string
  logo?: string
}

const topPartners: Partner[] = [
  {
    name: 'Lovable',
    href: 'https://lovable.dev/',
    logo: '/images/logos/publicity/lovable.svg',
  },
  {
    name: 'Bolt',
    href: 'https://bolt.new',
    logo: '/images/logos/publicity/bolt.svg',
  },
  {
    name: 'v0',
    href: 'https://v0.dev',
    logo: '/images/logos/publicity/v0.svg',
  },
  {
    name: 'Figma Make',
    href: 'https://www.figma.com/make/',
    logo: '/images/logos/publicity/figma.svg',
  },
  {
    name: 'Hostinger Horizons',
    href: 'https://www.hostinger.com/horizons',
    logo: '/images/logos/publicity/hostinger-horizons.svg',
  },
  {
    name: 'Tempo Labs',
    href: 'https://tempo.new',
    logo: '/images/logos/publicity/tempo.svg',
  },
]

const newPartners: Partner[] = [
  {
    name: 'Sav',
    href: 'https://www.sav.com/',
    logo: '/images/logos/publicity/sav.svg',
  },
  {
    name: 'OptiSigns',
    href: 'https://www.optisigns.com/',
    logo: '/images/logos/publicity/optisigns.svg',
  },
  {
    name: 'Nerd',
    href: 'https://www.nerdapp.ai/',
    logo: '/images/logos/publicity/nerd.png',
  },
  {
    name: 'CatDoes',
    href: 'https://catdoes.com/',
    logo: '/images/logos/publicity/catdoes.svg',
  },
  {
    name: 'Woz',
    href: 'https://woz.com/',
    logo: '/images/logos/publicity/woz.svg',
  },
  {
    name: 'Anyx',
    href: 'https://anyx.app/',
    logo: '/images/logos/publicity/anyx.png',
  },
  {
    name: 'Buildify.dev',
    href: 'https://buildify.dev/',
    logo: '/images/logos/publicity/buildify.svg',
  },
  {
    name: 'Fastshot',
    href: 'https://fastshot.ai/',
    logo: '/images/logos/publicity/fastshot.png',
  },
  {
    name: 'The Open Builder',
    href: 'https://theopenbuilder.com/',
    logo: '/images/logos/publicity/theopenbuilder.svg',
  },
  {
    name: 'Polymet',
    href: 'https://polymet.ai/',
    logo: '/images/logos/publicity/polymet.svg',
  },
  {
    name: 'Sinapsis',
    href: 'https://sinapsis.co/',
    logo: '/images/logos/publicity/sinapsis.svg',
  },
  {
    name: 'Elementor',
    href: 'https://elementor.com/',
    logo: '/images/logos/publicity/elementor.svg',
  },
]

interface PartnerLogoProps {
  partner: Partner
  size?: 'large' | 'small'
}

const PartnerLogo = ({ partner, size = 'small' }: PartnerLogoProps) => {
  const containerClasses =
    size === 'large' ? 'w-24 md:w-32 h-8 md:h-10' : 'w-16 md:w-20 h-5 md:h-6'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-3 rounded-lg hover:bg-surface-100 transition-colors"
        >
          {partner.logo ? (
            <img
              src={partner.logo}
              alt={partner.name}
              className={`${containerClasses} object-contain opacity-80 hover:opacity-100 transition-opacity grayscale dark:invert`}
              draggable={false}
              onError={(e) => {
                // If image fails to load, show text fallback
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'block'
              }}
            />
          ) : null}
          <span
            className={`text-foreground-lighter font-medium ${size === 'large' ? 'text-base md:text-lg' : 'text-xs md:text-sm'} ${partner.logo ? 'hidden' : ''}`}
            style={{ display: partner.logo ? 'none' : 'block' }}
          >
            {partner.name}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{partner.name}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface AIBuildersPartnersGridProps {
  className?: string
}

const AIBuildersPartnersGrid = ({ className }: AIBuildersPartnersGridProps) => {
  return (
    <div className={className}>
      {/* Top Partners - larger logos */}
      <div className="mb-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 items-center justify-items-center">
          {topPartners.map((partner) => (
            <PartnerLogo key={partner.name} partner={partner} size="large" />
          ))}
        </div>
      </div>

      {/* New Partners - smaller logos */}
      <div className="pt-6 border-t border-default">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 items-center justify-items-center">
          {newPartners.map((partner) => (
            <PartnerLogo key={partner.name} partner={partner} size="small" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default AIBuildersPartnersGrid
