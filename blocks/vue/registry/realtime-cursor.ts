import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/realtime-cursor/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/realtime-cursor/vue/registry-item.json' with { type: 'json' }

export const realtimeCursor = [nuxtjs, vue] as RegistryItem[]
