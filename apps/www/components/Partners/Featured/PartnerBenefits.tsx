import SectionContainer from '~/components/Layouts/SectionContainer'

interface Benefit {
  stat?: string
  title: string
  description: string
}

interface PartnerBenefitsProps {
  benefits: Benefit[]
}

export function PartnerBenefits({ benefits }: PartnerBenefitsProps) {
  return (
    <SectionContainer>
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex flex-col gap-3">
            {benefit.stat && (
              <span className="text-4xl lg:text-5xl font-bold text-brand">{benefit.stat}</span>
            )}
            <h3 className="text-xl font-medium">{benefit.title}</h3>
            <p className="text-foreground-lighter">{benefit.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

