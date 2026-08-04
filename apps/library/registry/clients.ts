import type { RegistryItem } from 'shadcn/schema'

import nextjs from './default/clients/nextjs/registry-item.json' with { type: 'json' }
import reactRouter from './default/clients/react-router/registry-item.json' with { type: 'json' }
import react from './default/clients/react/registry-item.json' with { type: 'json' }
import tanstack from './default/clients/tanstack/registry-item.json' with { type: 'json' }

export const clients = [nextjs, react, reactRouter, tanstack] as RegistryItem[]
