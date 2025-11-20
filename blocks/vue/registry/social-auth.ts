import { type Registry } from 'shadcn/schema'
import vue from './default/social-auth/vue/registry-item.json' with { type: 'json' }

export const socialAuth = [vue] as Registry['items']
