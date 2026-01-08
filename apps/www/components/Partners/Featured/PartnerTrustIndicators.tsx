import SectionContainer from '~/components/Layouts/SectionContainer'

interface TrustItem {
  badge: string
  title: string
  description: string
}

interface PartnerTrustIndicatorsProps {
  title: string
  items: TrustItem[]
}

export function PartnerTrustIndicators({ title, items }: PartnerTrustIndicatorsProps) {
  return (
    <SectionContainer className="border-t">
      <h2 className="text-2xl md:text-3xl font-medium mb-8">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="text-sm text-foreground-lighter uppercase tracking-wide">
              {item.badge}
            </span>
            <h3 className="text-lg font-medium">{item.title}</h3>
            <p className="text-foreground-lighter text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

