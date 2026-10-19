import type { Branch } from '@/data/branches/branches-query'

export const createTestBranch = (overrides: Partial<Branch> = {}): Branch => ({
  created_at: '2026-01-01T00:00:00Z',
  id: 'branch-id',
  is_default: false,
  name: 'branch',
  parent_project_ref: 'parent-ref',
  persistent: false,
  project_ref: 'branch-ref',
  status: 'MIGRATIONS_PASSED',
  updated_at: '2026-01-01T00:00:00Z',
  with_data: false,
  ...overrides,
})
