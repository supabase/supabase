import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { render } from '@/tests/helpers'

const {
  mockSendEvent,
  mockUseEdgeFunctionQuery,
  mockUseParams,
  mockUseProjectSettingsV2Query,
  mockUseSelectedOrganizationQuery,
} = vi.hoisted(() => ({
  mockSendEvent: vi.fn(),
  mockUseEdgeFunctionQuery: vi.fn(),
  mockUseParams: vi.fn(),
  mockUseProjectSettingsV2Query: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')

  return {
    ...actual,
    useParams: mockUseParams,
  }
})

vi.mock('@/data/config/project-settings-v2-query', () => ({
  useProjectSettingsV2Query: mockUseProjectSettingsV2Query,
}))

vi.mock('@/data/edge-functions/edge-function-query', () => ({
  useEdgeFunctionQuery: mockUseEdgeFunctionQuery,
}))

vi.mock('@/data/telemetry/send-event-mutation', () => ({
  useSendEventMutation: () => ({ mutate: mockSendEvent }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('../EdgeFunctionBlock/EdgeFunctionBlock', () => ({
  EdgeFunctionBlock: ({
    showReplaceWarning,
    onCancelReplace,
    onConfirmReplace,
  }: {
    showReplaceWarning?: boolean
    onCancelReplace?: () => void
    onConfirmReplace?: () => void
  }) => (
    <div>
      {showReplaceWarning && (
        <div>
          <p>An edge function with this name already exists.</p>
          <button onClick={onCancelReplace}>Cancel</button>
          <button onClick={onConfirmReplace}>Replace function</button>
        </div>
      )}
    </div>
  ),
}))

vi.mock('./ConfirmFooter', () => ({
  ConfirmFooter: ({
    confirmLabel,
    onConfirm,
  }: {
    confirmLabel?: string
    onConfirm?: () => void
  }) => <button onClick={onConfirm}>{confirmLabel ?? 'Confirm'}</button>,
}))

describe('EdgeFunctionRenderer', () => {
  beforeEach(() => {
    mockSendEvent.mockReset()
    mockUseEdgeFunctionQuery.mockReset()
    mockUseParams.mockReturnValue({ ref: 'project-ref' })
    mockUseProjectSettingsV2Query.mockReturnValue({ data: undefined })
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: { slug: 'org-slug' } })
  })

  it('only deploys an existing function from the replace warning confirmation', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()

    mockUseEdgeFunctionQuery.mockReturnValue({ data: { slug: 'hello-world' } })

    render(
      <EdgeFunctionRenderer
        label="Deploy Edge Function"
        code="Deno.serve(() => new Response('ok'))"
        functionName="hello-world"
        onApprove={onApprove}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Deploy' }))
    expect(screen.getByText('An edge function with this name already exists.')).toBeInTheDocument()
    expect(onApprove).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Deploy' }))
    expect(onApprove).not.toHaveBeenCalled()
    expect(mockSendEvent).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Replace function' }))
    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(mockSendEvent).toHaveBeenCalledTimes(1)
  })

  it('deploys immediately when no existing function is found', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()

    mockUseEdgeFunctionQuery.mockReturnValue({ data: undefined })

    render(
      <EdgeFunctionRenderer
        label="Deploy Edge Function"
        code="Deno.serve(() => new Response('ok'))"
        functionName="hello-world"
        onApprove={onApprove}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Deploy' }))

    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(mockSendEvent).toHaveBeenCalledTimes(1)
  })
})
