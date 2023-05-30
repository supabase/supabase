// [Joshen TODO] Ideally these come from API, but hard coded for now
export const USAGE_COSTS = [
  {
    category: 'Database',
    items: [
      { name: 'Database size', unit_amount: 0.125, unit: 'GB' },
      { name: 'Database egress', unit_amount: 0.09, unit: 'GB' },
    ],
  },
  {
    category: 'Authentication',
    items: [
      { name: 'MAUs', unit_amount: 0.00325, unit: 'MAU' },
      { name: 'Single Sign-On (SAML 2.0)', unit_amount: 0.015, unit: 'MAU' },
    ],
  },
  {
    category: 'Storage',
    items: [
      { name: 'Storage size', unit_amount: 0.021, unit: 'GB' },
      { name: 'Storage egress', unit_amount: 0.09, unit: 'GB' },
      { name: 'Image transformations', unit_amount: 5, unit: '1000 origin images' },
    ],
  },
  {
    category: 'Realtime',
    items: [
      { name: 'Concurrent Peak Connections', unit_amount: 10, unit: '1000 connections' },
      { name: 'Messages per month', unit_amount: 2.5, unit: 'million' },
    ],
  },
  {
    category: 'Edge Functions',
    items: [
      { name: 'Invocations', unit_amount: 0.125, unit: 'million' },
      { name: 'Number of functions', unit_amount: 10, unit: '100' },
    ],
  },
]
