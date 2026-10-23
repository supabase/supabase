import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DeleteProjectModal } from './DeleteProjectModal'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

// Heavy child with its own queries and permission checks, unrelated to this flow
vi.mock('@/components/layouts/ProjectLayout/LogicalBackupCliInstructions', () => ({
  LogicalBackupCliInstructions: () => null,
}))

const PROJECT: OrgProject = {
  ref: 'abcdefghijklmnopqrst',
  name: 'Project 1',
  status: 'ACTIVE_HEALTHY',
  cloud_provider: 'AWS',
  region: 'us-east-1',
  inserted_at: '2024-01-01T00:00:00Z',
  integration_source: null,
  is_branch: false,
  databases: [],
}
const ORGANIZATION = createMockOrganization({ slug: 'org-slug', plan: { id: 'pro', name: 'Pro' } })

const mockSubscription = (planId: 'free' | 'pro') => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/billing/subscription',
    response: {
      addons: [],
      billing_via_partner: false,
      current_period_end: 1700000000,
      current_period_start: 1700000000,
      next_invoice_at: 1700000000,
      payment_method_type: 'card',
      plan: { id: planId, name: planId },
      project_addons: [],
      usage_billing_enabled: false,
    },
  })
}

// Records the order requests hit the API, since the ordering is the contract under test
const mockSurveyAndDelete = ({ surveyStatus }: { surveyStatus: 201 | 403 }) => {
  const calls: string[] = []

  // The selected-project hook fires alongside the props; the component prefers the props
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/feedback/downgrade',
    response: () => {
      calls.push('survey')
      if (surveyStatus === 403) {
        return HttpResponse.json<APIErrorBody>({ message: 'Forbidden' }, { status: 403 })
      }
      return HttpResponse.json<{ result: string }>({ result: 'success' }, { status: 201 })
    },
  })
  addAPIMock({
    method: 'delete',
    path: '/platform/projects/:ref',
    response: () => {
      calls.push('delete')
      return HttpResponse.json<{ id: number; name: string; ref: string }>({
        id: 1,
        name: PROJECT.name,
        ref: PROJECT.ref,
      })
    },
  })

  return calls
}

const deleteProject = async () => {
  const [reason] = await screen.findAllByRole('radio', { hidden: true })
  fireEvent.click(reason)
  await userEvent.type(screen.getByPlaceholderText('Type the project name in here'), PROJECT.name)
  fireEvent.click(screen.getByRole('button', { name: 'I understand, delete this project' }))
  await new Promise((r) => setTimeout(r, 300))
  await new Promise((r) => setTimeout(r, 500))
}

describe('DeleteProjectModal', () => {
  beforeEach(() => {
    vi.spyOn(toast, 'error')
  })

  test('sends the exit survey before deleting a paid project', async () => {
    mockSubscription('pro')
    const calls = mockSurveyAndDelete({ surveyStatus: 201 })

    customRender(
      <DeleteProjectModal visible onClose={vi.fn()} project={PROJECT} organization={ORGANIZATION} />
    )
    await deleteProject()

    await waitFor(() => expect(calls).toEqual(['survey', 'delete']))
  })

  test('still deletes the project, without an error toast, when the survey fails', async () => {
    mockSubscription('pro')
    const calls = mockSurveyAndDelete({ surveyStatus: 403 })

    customRender(
      <DeleteProjectModal visible onClose={vi.fn()} project={PROJECT} organization={ORGANIZATION} />
    )
    await deleteProject()

    await waitFor(() => expect(calls).toEqual(['survey', 'delete']))
    expect(toast.error).not.toHaveBeenCalled()
  })
})
