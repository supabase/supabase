import { describe, it } from 'vitest'
// Tests for pages/api/platform/projects/[ref]/index.ts (Plan 02)
describe('GET /api/platform/projects/[ref]', () => {
  it.todo('returns project by ref name')
  it.todo('returns 404 when project not found')
})
describe('DELETE /api/platform/projects/[ref]', () => {
  it.todo('deletes project when confirm matches ref')
  it.todo('returns 400 when confirm does not match')
  it.todo('returns 204 on successful deletion')
})
