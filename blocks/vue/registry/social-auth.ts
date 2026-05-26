import { type Registry } from 'shadcn/schema'

import nuxt from './default/social-auth/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/social-auth/vue/registry-item.json' with { type: 'json' }

export const socialAuth = [vue, nuxt] as Registry['items']
