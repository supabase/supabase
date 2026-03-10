import { describe, it } from 'vitest'
// Tests for pages/api/platform/projects/index.ts (Plan 02)
describe('GET /api/platform/projects', () => {
  it.todo('returns all projects from provisioner.listProjects()')
  it.todo('maps provisioner status to Studio status (active -> ACTIVE_HEALTHY)')
  it.todo('returns projects sorted by created_at')
  it.todo('returns empty array when no projects exist')
})
describe('POST /api/platform/projects', () => {
  it.todo('creates project and returns 201 with Studio project shape')
  it.todo('returns 400 for invalid project name')
  it.todo('returns 500 when provisioner throws')
})
