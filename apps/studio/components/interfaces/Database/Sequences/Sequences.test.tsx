import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { Sequences } from './Sequences'

// --- mock nuqs ---
vi.mock('nuqs', () => ({
  parseAsString: { withDefault: () => ({ withDefault: () => '' }) },
  useQueryState: vi.fn(() => ['', vi.fn()]),
}))

// --- mock hooks ---
const mockProject = { ref: 'test-ref', connectionString: 'postgres://localhost/test' }

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: mockProject }),
}))

vi.mock('@/hooks/misc/useSchemaQueryState', () => ({
  useQuerySchemaState: () => ({ selectedSchema: 'public', setSelectedSchema: vi.fn() }),
}))

vi.mock('@/hooks/useProtectedSchemas', () => ({
  useIsProtectedSchema: () => ({ isSchemaLocked: false }),
}))

vi.mock('@/data/database/schemas-query', () => ({
  useSchemasQuery: () => ({ isSuccess: true }),
}))

const mockResetMutate = vi.fn()

vi.mock('@/data/database-sequences/sequence-reset-mutation', () => ({
  useSequenceResetMutation: ({ onSuccess }: { onSuccess: () => void }) => ({
    mutate: mockResetMutate.mockImplementation(() => onSuccess()),
    isPending: false,
  }),
}))

const mockSequences = [
  {
    name: 'users_id_seq',
    owner_table: 'users',
    owner_column: 'id',
    data_type: 'bigint',
    last_value: 42,
    start_value: 1,
    increment_by: 1,
    min_value: 1,
    max_value: 9223372036854775807,
    cycle: false,
  },
]

vi.mock('@/data/database-sequences/sequences-query', () => ({
  useSequencesQuery: () => ({
    data: mockSequences,
    error: null,
    isPending: false,
    isSuccess: true,
    isError: false,
  }),
}))

// --- mock child components ---
vi.mock('./SequenceSheet', () => ({ SequenceSheet: () => null }))
vi.mock('../ProtectedSchemaWarning', () => ({ ProtectedSchemaWarning: () => null }))
vi.mock('@/components/ui/AlertError', () => ({ default: () => null }))
vi.mock('@/components/ui/SchemaSelector', () => ({ default: () => null }))

describe('Sequences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the sequence row', () => {
    render(<Sequences />)
    expect(screen.getByText('users_id_seq')).toBeInTheDocument()
  })

  it('does NOT render an Edit button', () => {
    render(<Sequences />)
    expect(screen.queryByRole('button', { name: /edit sequence/i })).not.toBeInTheDocument()
  })

  it('renders a Reset button', () => {
    render(<Sequences />)
    expect(screen.getByRole('button', { name: /reset sequence value/i })).toBeInTheDocument()
  })

  it('opens the reset dialog when Reset is clicked', async () => {
    const user = userEvent.setup()
    render(<Sequences />)

    await user.click(screen.getByRole('button', { name: /reset sequence value/i }))

    expect(screen.getByText(/reset sequence/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset value/i })).toBeInTheDocument()
  })

  it('calls reset mutation with correct args and closes dialog on confirm', async () => {
    const user = userEvent.setup()
    render(<Sequences />)

    await user.click(screen.getByRole('button', { name: /reset sequence value/i }))

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '1000')

    await user.click(screen.getByRole('button', { name: /reset value/i }))

    expect(mockResetMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef: 'test-ref',
        schema: 'public',
        name: 'users_id_seq',
        newValue: 1000,
      })
    )

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /reset value/i })).not.toBeInTheDocument()
    })
  })

  it('closes the reset dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<Sequences />)

    await user.click(screen.getByRole('button', { name: /reset sequence value/i }))
    expect(screen.getByRole('button', { name: /reset value/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /reset value/i })).not.toBeInTheDocument()
    })
  })
})
