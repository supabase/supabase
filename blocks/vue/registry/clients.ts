import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/clients/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/clients/vue/registry-item.json' with { type: 'json' }

export const clients = [nuxtjs, vue] as RegistryItem[]
