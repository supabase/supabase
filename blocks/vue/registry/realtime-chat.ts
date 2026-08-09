import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/realtime-chat/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/realtime-chat/vue/registry-item.json' with { type: 'json' }

export const realtimeChat = [nuxtjs, vue] as RegistryItem[]
