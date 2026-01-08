import Panel from '~/components/Panel'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Benefit {
  stat?: string
  icon?: React.ReactNode
  title: string
  description: string
}

interface PartnerBenefitsProps {
  benefits: Benefit[]
}

export function PartnerBenefits({ benefits }: PartnerBenefitsProps) {
  return (
    <SectionContainer className="relative z-10 lg:-mt-16">
      <div className="grid md:grid-cols-3 gap-4">
        {benefits.map((benefit, i) => (
          <Panel key={i} outerClassName="h-full">
            <div className="p-6 flex flex-col gap-3">
              {benefit.stat && (
                <span className="text-3xl lg:text-4xl text-brand">{benefit.stat}</span>
              )}
              {benefit.icon && (
                <div className="text-foreground-light">{benefit.icon}</div>
              )}
              <h3 className="text-lg">{benefit.title}</h3>
              <p className="text-foreground-lighter text-sm">{benefit.description}</p>
            </div>
          </Panel>
        ))}
      </div>
    </SectionContainer>
  )
}
