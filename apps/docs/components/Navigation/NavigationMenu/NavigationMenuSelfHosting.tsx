import specAnalyticsV0 from '~/spec/analytics_v0_config.yaml' assert { type: 'yml' }
import specAuthV1 from '~/spec/gotrue_v1_config.yaml' assert { type: 'yml' }
import specRealtimeV0 from '~/spec/realtime_v0_config.yaml' assert { type: 'yml' }
import specStorageV0 from '~/spec/storage_v0_config.yaml' assert { type: 'yml' }
import type { NavMenuSection } from '../Navigation.types'
import { self_hosting } from './NavigationMenu.constants'
import {
  NavigationMenuGuideHeader,
  NavigationMenuGuideScaffold,
} from './NavigationMenuGuideListItems'
import {
  NavigationMenuSelfHostingContent,
  NavigationMenuSelfHostingDropdown,
} from './NavigationMenuSelfHosting.client'
import { NavigationMenuGuideListWrapper } from './NavigationMenuGuideList'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function navigationMenuFromSpec(spec: any): NavMenuSection {
  return {
    name: spec.info.title,
    items: spec.info.tags.map((tag) => ({
      id: tag.id,
      name: tag.title,
      items: spec.parameters
        .filter((param) => param.tags.includes(tag.id))
        .map((param) => ({ id: param.id, name: param.title, url: `#${tag.id}-${param.id}` })),
    })),
  }
}

const specs = {
  analytics: navigationMenuFromSpec(specAnalyticsV0),
  auth: navigationMenuFromSpec(specAuthV1),
  realtime: navigationMenuFromSpec(specRealtimeV0),
  storage: navigationMenuFromSpec(specStorageV0),
}

export function NavigationMenuSelfHosting() {
  return (
    <NavigationMenuGuideListWrapper id="self-hosting">
      <NavigationMenuGuideScaffold>
        <NavigationMenuGuideHeader
          id="self-hosting"
          title={self_hosting.title}
          icon={self_hosting.icon}
          href={self_hosting.url}
        />
        <NavigationMenuSelfHostingDropdown />
        <NavigationMenuSelfHostingContent spec={specs} />
      </NavigationMenuGuideScaffold>
    </NavigationMenuGuideListWrapper>
  )
}
