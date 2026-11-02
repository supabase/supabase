import type { BreadcrumbItem } from './json-ld'

const SITE = 'https://supabase.com'

const home: BreadcrumbItem = { name: 'Home', url: SITE }

export const breadcrumbs = {
  blogIndex: [home, { name: 'Blog', url: `${SITE}/blog` }],
  customersIndex: [home, { name: 'Customer Stories', url: `${SITE}/customers` }],
  eventsIndex: [home, { name: 'Events', url: `${SITE}/events` }],
  database: [home, { name: 'Database', url: `${SITE}/database` }],
  auth: [home, { name: 'Auth', url: `${SITE}/auth` }],
  storage: [home, { name: 'Storage', url: `${SITE}/storage` }],
  edgeFunctions: [home, { name: 'Edge Functions', url: `${SITE}/edge-functions` }],
  realtime: [home, { name: 'Realtime', url: `${SITE}/realtime` }],
  vector: [home, { name: 'Vector', url: `${SITE}/modules/vector` }],
  cron: [home, { name: 'Cron', url: `${SITE}/modules/cron` }],
  queues: [home, { name: 'Queues', url: `${SITE}/modules/queues` }],
  pricing: [home, { name: 'Pricing', url: `${SITE}/pricing` }],
  careers: [home, { name: 'Careers', url: `${SITE}/careers` }],
  company: [home, { name: 'Company', url: `${SITE}/company` }],
  features: [home, { name: 'Features', url: `${SITE}/features` }],
} satisfies Record<string, BreadcrumbItem[]>
