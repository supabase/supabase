import { type RegistryItem } from 'shadcn/schema'

import { clients } from './clients'
import currentUserAvatar from './default/blocks/current-user-avatar/registry-item.json' with { type: 'json' }
import dropzone from './default/blocks/dropzone/registry-item.json' with { type: 'json' }
import infiniteQueryHook from './default/blocks/infinite-query-hook/registry-item.json' with { type: 'json' }
import passwordBasedAuthNextjs from './default/blocks/password-based-auth-nextjs/registry-item.json' with { type: 'json' }
import passwordBasedAuthReactRouter from './default/blocks/password-based-auth-react-router/registry-item.json' with { type: 'json' }
import passwordBasedAuthReact from './default/blocks/password-based-auth-react/registry-item.json' with { type: 'json' }
import passwordBasedAuthTanstack from './default/blocks/password-based-auth-tanstack/registry-item.json' with { type: 'json' }
import realtimeAvatarStack from './default/blocks/realtime-avatar-stack/registry-item.json' with { type: 'json' }
import realtimeChat from './default/blocks/realtime-chat/registry-item.json' with { type: 'json' }
import realtimeCursor from './default/blocks/realtime-cursor/registry-item.json' with { type: 'json' }
import socialAuthNextjs from './default/blocks/social-auth-nextjs/registry-item.json' with { type: 'json' }
import socialAuthReactRouter from './default/blocks/social-auth-react-router/registry-item.json' with { type: 'json' }
import socialAuthReact from './default/blocks/social-auth-react/registry-item.json' with { type: 'json' }
import socialAuthTanstack from './default/blocks/social-auth-tanstack/registry-item.json' with { type: 'json' }
import { registryItemAppend } from './utils'

const combine = (component: RegistryItem) => {
  return clients.flatMap((client) => {
    return registryItemAppend(
      {
        ...component,
        name: `${component.name}-${client.name.replace('supabase-client-', '')}`,
      },
      [client]
    )
  })
}

const nextjsClient = clients.find((client) => client.name === 'supabase-client-nextjs')
const reactClient = clients.find((client) => client.name === 'supabase-client-react')
const tanstackClient = clients.find((client) => client.name === 'supabase-client-tanstack')
const reactRouterClient = clients.find((client) => client.name === 'supabase-client-react-router')

export const blocks = [
  registryItemAppend(passwordBasedAuthNextjs as RegistryItem, [nextjsClient!]),
  registryItemAppend(passwordBasedAuthReact as RegistryItem, [reactClient!]),
  registryItemAppend(passwordBasedAuthReactRouter as RegistryItem, [reactRouterClient!]),
  registryItemAppend(passwordBasedAuthTanstack as RegistryItem, [tanstackClient!]),

  registryItemAppend(socialAuthNextjs as RegistryItem, [nextjsClient!]),
  registryItemAppend(socialAuthReact as RegistryItem, [reactClient!]),
  registryItemAppend(socialAuthReactRouter as RegistryItem, [reactRouterClient!]),
  registryItemAppend(socialAuthTanstack as RegistryItem, [tanstackClient!]),

  ...combine(dropzone as RegistryItem),
  ...combine(realtimeCursor as RegistryItem),
  ...combine(currentUserAvatar as RegistryItem),
  ...combine(realtimeAvatarStack as RegistryItem),
  ...combine(realtimeChat as RegistryItem),
  // infinite query hook is intentionally not combined with the clients since it depends on clients having database types.
  infiniteQueryHook as RegistryItem,
] as RegistryItem[]
