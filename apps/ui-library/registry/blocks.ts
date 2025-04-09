import { type Registry, type RegistryItem } from 'shadcn/registry'
import { clients } from './clients'
import currentUserAvatar from './default/blocks/current-user-avatar/registry-item.json' assert { type: 'json' }
import dropzone from './default/blocks/dropzone/registry-item.json' assert { type: 'json' }
import passwordBasedAuthNextjs from './default/blocks/password-based-auth-nextjs/registry-item.json' assert { type: 'json' }
import passwordBasedAuthReactRouter from './default/blocks/password-based-auth-react-router/registry-item.json' assert { type: 'json' }
import passwordBasedAuthReact from './default/blocks/password-based-auth-react/registry-item.json' assert { type: 'json' }
import passwordBasedAuthTanstack from './default/blocks/password-based-auth-tanstack/registry-item.json' assert { type: 'json' }
import realtimeAvatarStack from './default/blocks/realtime-avatar-stack/registry-item.json' assert { type: 'json' }

import realtimeChat from './default/blocks/realtime-chat/registry-item.json' assert { type: 'json' }
import realtimeCursor from './default/blocks/realtime-cursor/registry-item.json' assert { type: 'json' }
import { registryItemAppend } from './utils'

const combine = (component: Registry['items'][number]) => {
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
  ...combine(dropzone as RegistryItem),
  ...combine(realtimeCursor as RegistryItem),
  ...combine(currentUserAvatar as RegistryItem),
  ...combine(realtimeAvatarStack as RegistryItem),
  ...combine(realtimeChat as RegistryItem),
] as Registry['items']
