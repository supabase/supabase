import { type Registry } from 'shadcn/registry'
import { clients } from './clients'
import dropzone from './default/blocks/dropzone/registry-item.json' assert { type: 'json' }
import passwordBasedAuthNextjs from './default/blocks/password-based-auth-nextjs/registry-item.json' assert { type: 'json' }
import passwordBasedAuthReact from './default/blocks/password-based-auth-react/registry-item.json' assert { type: 'json' }
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

export const blocks = [
  passwordBasedAuthNextjs,
  passwordBasedAuthReact,
  ...combine(dropzone as Registry['items'][number]),
  ...combine(realtimeCursor as Registry['items'][number]),
] as Registry['items']
