import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AskAgent } from '../common'
import { renderWithTooltip, testCapabilities, testProject } from '../test-utils'
import { ProjectList, type ProjectListProps } from './project-list'

afterEach(cleanup)

function setup(props: Partial<ProjectListProps> = {}) {
  const onOpenProject = vi.fn()
  renderWithTooltip(
    <ProjectList
      projects={[testProject]}
      organizations={[{ id: 'org-1', slug: 'acme', name: 'Acme Inc' }]}
      capabilities={testCapabilities}
      isLoading={false}
      onOpenProject={onOpenProject}
      {...props}
    />
  )
  return { onOpenProject }
}

describe('ProjectList', () => {
  it('opens a project from its row and names its organization', () => {
    const { onOpenProject } = setup()
    expect(screen.getByText('Acme Inc')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: testProject.name }))
    expect(onOpenProject).toHaveBeenCalledWith(testProject)
  })

  it('sends a check for a project to the agent as a request the host phrases', async () => {
    const onAsk = vi.fn<AskAgent>(async () => {})
    setup({ onAsk })
    fireEvent.pointerDown(
      screen.getByRole('button', { name: `More actions for ${testProject.name}` }),
      {
        button: 0,
        ctrlKey: false,
      }
    )
    await act(async () => {
      fireEvent.click(await screen.findByRole('menuitem', { name: /Health check/ }))
    })
    expect(onAsk).toHaveBeenCalledWith({
      type: 'project-check',
      project: testProject,
      check: 'health',
    })
  })

  it('explains an empty list instead of showing an empty table', () => {
    setup({ projects: [] })
    expect(screen.getByText('No projects visible')).toBeTruthy()
  })
})
