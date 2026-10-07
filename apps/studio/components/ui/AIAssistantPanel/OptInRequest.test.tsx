import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OptInRequest } from './OptInRequest'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { customRender as render } from '@/tests/lib/custom-render'

vi.mock('@/hooks/misc/useCheckPermissions', () => ({ useAsyncCheckPermissions: vi.fn() }))
const mockLevel = vi.hoisted(() => ({ current: 'disabled' }))
vi.mock('@/hooks/misc/useOrgOptedIntoAi', () => ({
  useOrgAiOptInLevel: () => ({ aiOptInLevel: mockLevel.current, includeSchemaMetadata: true }),
}))
vi.mock('./AIOptInModal', () => ({
  AIOptInModal: ({ visible, onSaved }: { visible: boolean; onSaved: () => void }) =>
    visible ? (
      <button tabIndex={0} onClick={onSaved}>
        Save level
      </button>
    ) : null,
}))

const setCanUpdate = (can: boolean) =>
  vi
    .mocked(useAsyncCheckPermissions)
    .mockReturnValue({ can } as ReturnType<typeof useAsyncCheckPermissions>)

describe('OptInRequest', () => {
  beforeEach(() => {
    setCanUpdate(true)
    mockLevel.current = 'disabled'
  })

  it('lets admins skip or review, and approves once the level is saved', () => {
    const onApprove = vi.fn()
    const onDeny = vi.fn()
    render(
      <OptInRequest
        requiredLevel="schema"
        confirmState="approval-requested"
        onApprove={onApprove}
        onDeny={onDeny}
      />
    )

    expect(screen.getByText(/Your organization is set to Disabled/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review opt-in level' }))
    expect(onApprove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save level' }))
    expect(onApprove).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onDeny).toHaveBeenCalledOnce()
  })

  it('says access was not granted when the saved level is below the request', () => {
    render(
      <OptInRequest
        requiredLevel="schema_and_log_and_data"
        output={{ level: 'disabled', sufficient: false }}
        confirmState="success"
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Schema, Logs & Database Data access was not granted'
    )
  })

  it('opens the modal without naming a level when none is requested', () => {
    render(<OptInRequest confirmState="approval-requested" />)

    expect(screen.getByText(/Your organization is set to Disabled/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Review opt-in level' }))
    expect(screen.getByRole('button', { name: 'Save level' })).toBeInTheDocument()
  })

  it('reports the level it was raised at and what it changed to', () => {
    mockLevel.current = 'schema'
    render(
      <OptInRequest levelAtRequest="disabled" output={{ level: 'schema' }} confirmState="success" />
    )

    expect(screen.getByText(/Your organization is set to Disabled/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Opt-in level updated to Schema Only')
  })

  it('shows non-admins a permission notice with only Continue', () => {
    setCanUpdate(false)
    render(<OptInRequest requiredLevel="schema" confirmState="approval-requested" />)

    expect(screen.getByText(/You need additional permissions/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review opt-in level' })).not.toBeInTheDocument()
  })
})
