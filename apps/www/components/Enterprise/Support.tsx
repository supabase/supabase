import { FeatureItem, type Feature } from '~/components/FeatureItem'
import SectionContainer from '~/components/Layouts/SectionContainer'
import type { FC, ReactNode } from 'react'

interface Props {
  id: string
  label?: ReactNode
  heading: ReactNode
  features: Feature[]
}

const Support: FC<Props> = (props) => {
  return (
    <SectionContainer id={props.id} className="flex flex-col gap-4 md:gap-8">
      <div className="flex flex-col gap-2">
        <span className="label">{props.label}</span>
        <h2 className="h2">{props.heading}</h2>
      </div>
      <ul className="grid grid-cols-1 gap-4 gap-y-10 md:grid-cols-3 md:gap-12 xl:gap-20">
        {props.features.map((feature) => (
          <FeatureItem feature={feature} key={feature.heading} />
        ))}
      </ul>
    </SectionContainer>
  )
}

export default Support
