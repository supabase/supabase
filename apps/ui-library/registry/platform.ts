import { type Registry, type RegistryItem } from 'shadcn/registry'

import embeddedDashboardNextjs from './default/platform/platform-kit-nextjs/registry-item.json' with { type: 'json' }

export const platform = [embeddedDashboardNextjs as RegistryItem] as Registry['items']
