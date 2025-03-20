import { type Registry } from 'shadcn/registry'
import nextjs from './default/clients/nextjs/registry-item.json' assert { type: 'json' }
import react from './default/clients/react/registry-item.json' assert { type: 'json' }
import remix from './default/clients/remix/registry-item.json' assert { type: 'json' }
import tanstack from './default/clients/tanstack/registry-item.json' assert { type: 'json' }

export const clients = [nextjs, react, remix, tanstack] as Registry['items']
