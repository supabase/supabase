import { type Registry } from 'shadcn/schema'

import nuxtjs from './default/password-based-auth/nuxtjs/registry-item.json' with { type: 'json' }
import vue from './default/password-based-auth/vue/registry-item.json' with { type: 'json' }

export const passwordBasedAuth = [nuxtjs, vue] as Registry['items']
