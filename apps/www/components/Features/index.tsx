import { Button, Badge, IconArrowRight } from 'ui'
import SectionHeader from 'components/UI/SectionHeader'
import Solutions from 'data/Solutions.json'
import Link from 'next/link'
import SectionContainer from '../Layouts/SectionContainer'
import ProductIcon from '../ProductIcon'
import TextLink from '../TextLink'

const Features = () => {
  const IconSections = Object.values(Solutions).map((solution: any) => {
    const { name, description, icon, label, url } = solution
    if (solution.name === 'Realtime') return null
    return (
      <div key={name} className="mb-10 space-y-4 md:mb-0">
        <div className="flex items-center">
          <ProductIcon icon={icon} />
          <dt className="text-scale-1200 ml-4 flex flex-row xl:flex-col">{name}</dt>
        </div>

        <p className="p">{description}</p>

        {label && (
          <div>
            <Badge dot>{label}</Badge>
          </div>
        )}
        {url && <TextLink label={label ? 'Get notified' : 'Learn more'} url={url} />}
      </div>
    )
  })

  return (
    <SectionContainer className="space-y-16 pb-0">
      <h3 className="h3">Build faster and focus on your products</h3>
      <dl className="grid grid-cols-1 gap-y-4  sm:grid-cols-2 md:grid-cols-2 md:gap-16 lg:grid-cols-4 lg:gap-x-8 xl:gap-x-24">
        {IconSections}
      </dl>
    </SectionContainer>
  )
}

export default Features
