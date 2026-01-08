import Image from 'next/image'
import Panel from '~/components/Panel'
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
    <SectionContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Panel key={i} outerClassName="h-full">
            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-xl text-brand">{stat.value}</span>
                <span className="text-xl text-foreground-light"> {stat.label}</span>
              </div>
              {stat.companyLogo && (
                <Image
                  src={stat.companyLogo}
                  alt={stat.company || ''}
                  width={80}
                  height={24}
                  className="opacity-70"
                />
              )}
              {stat.company && !stat.companyLogo && (
                <span className="text-sm text-foreground-muted uppercase tracking-wide">
                  {stat.company}
                </span>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </SectionContainer>
  )
}
