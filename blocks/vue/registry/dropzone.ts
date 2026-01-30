import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/dropzone/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/dropzone/vue/registry-item.json' with { type: 'json' }

export const dropzone = [nuxtjs, vue] as RegistryItem[]
