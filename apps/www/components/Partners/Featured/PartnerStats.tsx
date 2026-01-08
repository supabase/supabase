import Image from 'next/image'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Stat {
  value: string
  label: string
  company?: string
  companyLogo?: string
}

interface PartnerStatsProps {
  stats: Stat[]
}

export function PartnerStats({ stats }: PartnerStatsProps) {
  return (
    <SectionContainer className="border-t border-b">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
            <span className="text-sm text-foreground-lighter">{stat.label}</span>
            {stat.companyLogo && (
              <Image
                src={stat.companyLogo}
                alt={stat.company || ''}
                width={80}
                height={24}
                className="mt-2 opacity-50"
              />
            )}
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

