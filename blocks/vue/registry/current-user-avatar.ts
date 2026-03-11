import { type RegistryItem } from 'shadcn/schema'

import nuxtjs from './default/current-user-avatar/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/current-user-avatar/vue/registry-item.json' with { type: 'json' }

export const currentUserAvatar = [nuxtjs, vue] as RegistryItem[]