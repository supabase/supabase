import Panel from '~/components/Panel'
import SectionContainer from '~/components/Layouts/SectionContainer'
import {
  ShieldCheck,
  HeartPulse,
  Lock,
  KeyRound,
  Network,
  History,
  LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'SOC 2 Type 2': ShieldCheck,
  'HIPAA Eligible': HeartPulse,
  'AWS PrivateLink': Lock,
  Encryption: KeyRound,
  'VPC Peering': Network,
  'Point-in-Time': History,
}

interface TrustItem {
  badge: string
  title: string
  description: string
  icon?: React.ReactNode
}

interface PartnerTrustIndicatorsProps {
  title: string
  items: TrustItem[]
}

export function PartnerTrustIndicators({ title, items }: PartnerTrustIndicatorsProps) {
  return (
    <SectionContainer>
      <h2 className="text-2xl md:text-3xl mb-8">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => {
          const IconComponent = ICON_MAP[item.badge] || ShieldCheck
          return (
            <Panel key={i} innerClassName="flex flex-col gap-3" outerClassName="h-full">
              <div className="p-6">
                <div className="text-foreground-light mb-3 [&>svg]:stroke-1">
                  {item.icon || <IconComponent className="w-5 h-5" />}
                </div>
                <span className="text-xs text-foreground-muted uppercase tracking-wide">
                  {item.badge}
                </span>
                <h3 className="text-lg mt-1">{item.title}</h3>
                <p className="text-foreground-lighter text-sm mt-2">{item.description}</p>
              </div>
            </Panel>
          )
        })}
      </div>
    </SectionContainer>
  )
}
