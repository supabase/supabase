import { Badge } from 'ui'
import Solutions from 'data/Solutions.json'
import Telemetry from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'
import SectionContainer from '../Layouts/SectionContainer'
import ProductIcon from '../ProductIcon'
import TextLink from '../TextLink'
import { useGoogleAnalyticsProps } from 'common/hooks/useGoogleAnalyticsProps'
import { useRouter } from 'next/router'

const Features = () => {
  const router = useRouter()
  const googleAnalyticsProps = useGoogleAnalyticsProps()

  const sendTelemetryEvent = async (product: any) => {
    switch (product) {
      case 'Database':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_database'],
          googleAnalyticsProps,
          router
        )
      case 'Authentication':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_auth'],
          googleAnalyticsProps,
          router
        )
      case 'Storage':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_storage'],
          googleAnalyticsProps,
          router
        )
      case 'Edge Functions':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_edgeFunctions'],
          googleAnalyticsProps,
          router
        )
      case 'Realtime':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_realtime'],
          googleAnalyticsProps,
          router
        )
    }
  }

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
        {url && (
          <TextLink
            label={label ? 'Get notified' : 'Learn more'}
            url={url}
            onClick={() => sendTelemetryEvent(name)}
          />
        )}
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
