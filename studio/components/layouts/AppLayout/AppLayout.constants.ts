export const PROJECT_PAGES = [
  { key: 'home', name: 'Overview', url: '/project/[ref]' },
  { key: 'editor', name: 'Table Editor', url: '/project/[ref]/editor' },
  { key: 'sql', name: 'SQL Editor', url: '/project/[ref]/sql' },
  { key: 'database', name: 'Database', url: '/project/[ref]/database/tables' },
  { key: 'auth', name: 'Authentication', url: '/project/[ref]/auth/users' },
  { key: 'storage', name: 'Storage', url: '/project/[ref]/storage/buckets' },
  { key: 'functions', name: 'Edge Functions', url: '/project/[ref]/functions' },
  { key: 'reports', name: 'Reports', url: '/project/[ref]/reports' },
  { key: 'logs', name: 'Logs', url: '/project/[ref]/logs/explorer' },
  { key: 'api', name: 'API', url: '/project/[ref]/api' },
  { key: 'settings', name: 'Settings', url: '/project/[ref]/settings/general' },
]

export const ORGANIZATION_PAGES = [
  { key: 'home', name: 'Projects', url: '/org/[slug]' },
  { key: 'team', name: 'Team', url: '/org/[slug]/team' },
  { key: 'integrations', name: 'Integrations', url: '/org/[slug]/integrations' },
  { key: 'apps', name: 'OAuth Apps', url: '/org/[slug]/apps' },
  { key: 'usage', name: 'Usage', url: '/org/[slug]/usage' },
  { key: 'billing', name: 'Billing', url: '/org/[slug]/billing' },
  { key: 'audit', name: 'Audit Logs', url: '/org/[slug]/audit' },
  { key: 'settings', name: 'Settings', url: '/org/[slug]/general' },
]
