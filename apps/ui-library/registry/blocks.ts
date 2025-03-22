import { type Registry, type RegistryItem } from 'shadcn/registry'
import { clients } from './clients'
import dropzone from './default/blocks/dropzone/registry-item.json' assert { type: 'json' }
import passwordBasedAuthNextjs from './default/blocks/password-based-auth-nextjs/registry-item.json' assert { type: 'json' }
import passwordBasedAuthReact from './default/blocks/password-based-auth-react/registry-item.json' assert { type: 'json' }
import passwordBasedAuthTanstack from './default/blocks/password-based-auth-tanstack/registry-item.json' assert { type: 'json' }

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

export const blocks = [
  registryItemAppend(passwordBasedAuthNextjs as RegistryItem, [nextjsClient!]),
  registryItemAppend(passwordBasedAuthReact as RegistryItem, [reactClient!]),
  registryItemAppend(passwordBasedAuthTanstack as RegistryItem, [tanstackClient!]),
  ...combine(dropzone as RegistryItem),
  ...combine(realtimeCursor as RegistryItem),
] as Registry['items']
