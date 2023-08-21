import { Badge } from 'ui'
import Solutions from 'data/Solutions'
import Telemetry from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'
import SectionContainer from '../Layouts/SectionContainer'
import ProductIcon from '../ProductIcon'
import TextLink from '../TextLink'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import { useRouter } from 'next/router'

const Features = () => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const sendTelemetryEvent = async (product: any) => {
    switch (product) {
      case 'Database':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_database'],
          telemetryProps,
          router
        )
      case 'Authentication':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_auth'],
          telemetryProps,
          router
        )
      case 'Storage':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_storage'],
          telemetryProps,
          router
        )
      case 'Edge Functions':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_edgeFunctions'],
          telemetryProps,
          router
        )
      case 'Realtime':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_realtime'],
          telemetryProps,
          router
        )
      case 'Vector':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_vector'],
          telemetryProps,
          router
        )
    }
  }

  const IconSections = Object.values(Solutions).map((solution: any) => {
    const { name, description, icon, label, url } = solution

    return (
      <div key={name} className="mb-10 space-y-4 md:mb-0">
        <div className="flex items-center">
          <ProductIcon icon={icon} />
          <dt className="text-scale-1200 ml-3 flex flex-row xl:flex-col">{name}</dt>
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
      <h3 className="h3 text-center">Build faster and focus on your products</h3>
      <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-2 md:gap-16 xl:grid-cols-6 lg:gap-x-8">
        {IconSections}
      </dl>
    </SectionContainer>
  )
}

export default Features
