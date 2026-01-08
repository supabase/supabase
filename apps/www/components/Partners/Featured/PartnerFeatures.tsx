import SectionContainer from '~/components/Layouts/SectionContainer'

interface Feature {
  title: string
  description: string
}

interface PartnerFeaturesProps {
  features: Feature[]
  columns?: 2 | 3
}

export function PartnerFeatures({ features, columns = 3 }: PartnerFeaturesProps) {
  return (
    <SectionContainer>
      <div
        className={
          columns === 2
            ? 'grid md:grid-cols-2 gap-8 lg:gap-12'
            : 'grid md:grid-cols-3 gap-8 lg:gap-12'
        }
      >
        {features.map((feature, i) => (
          <div key={i} className="flex flex-col gap-4">
            <h3 className="text-xl font-medium">{feature.title}</h3>
            <p className="text-foreground-lighter">{feature.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

