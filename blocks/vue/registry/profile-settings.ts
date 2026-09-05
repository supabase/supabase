import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/profile-settings/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/profile-settings/vue/registry-item.json' with { type: 'json' }

export const profileSettings = [nuxtjs, vue] as RegistryItem[]
