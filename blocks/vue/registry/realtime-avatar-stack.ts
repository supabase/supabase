import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/realtime-avatar-stack/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/realtime-avatar-stack/vue/registry-item.json' with { type: 'json' }

export const realtimeAvatarStack = [nuxtjs, vue] as RegistryItem[]
