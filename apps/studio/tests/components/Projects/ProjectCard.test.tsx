import { describe, it } from 'vitest'
// Tests for components/interfaces/Projects/* (Plan 03)
describe('ProjectCard', () => {
  it.todo('renders project name as heading')
  it.todo('renders status badge with correct color for ACTIVE_HEALTHY')
  it.todo('renders schema name in muted text')
  it.todo('renders created date')
  it.todo('links to /project/{ref}/editor')
})

describe('CreateProjectModal', () => {
  it.todo('validates project name against ^[a-z][a-z0-9_]*$ pattern')
  it.todo('submits POST to /api/platform/projects')
  it.todo('calls onSuccess after successful creation')
  it.todo('shows error message on failure')
})

describe('DeleteProjectDialog', () => {
  it.todo('disables delete button until typed name matches')
  it.todo('submits DELETE to /api/platform/projects/[ref]')
  it.todo('redirects to /projects after successful deletion')
})
