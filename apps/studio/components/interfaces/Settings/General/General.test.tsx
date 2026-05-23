import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { General } from './General'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockIsPlatform,
  mockUseAsyncCheckPermissions,
  mockUseProjectUpdateMutation,
  mockUseSelectedProjectQuery,
} = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseProjectUpdateMutation: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/data/projects/project-update-mutation', () => ({
  useProjectUpdateMutation: mockUseProjectUpdateMutation,
}))

vi.mock('./ProjectAccessSection', () => ({
  ProjectAccessSection: () => <div>ProjectAccessSection</div>,
}))

describe('General', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isLoading: false })
    mockUseProjectUpdateMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: {
        id: 1,
        ref: 'project-ref',
        name: 'My Project',
        region: 'us-east-1',
        parent_project_ref: null,
      },
    })
  })

  describe('platform', () => {
    it('renders the editable form with project name, ID, region, and Save action', () => {
      render(<General />)

      // Editable project name input populated with current value
      const nameInput = screen.getByDisplayValue('My Project') as HTMLInputElement
      expect(nameInput).toBeInTheDocument()
      expect(nameInput).not.toBeDisabled()
      expect(nameInput).not.toHaveAttribute('readonly')

      // Project ID and region rows visible
      expect(screen.getByText('Project ID')).toBeInTheDocument()
      expect(screen.getByText('Project region')).toBeInTheDocument()

      // Save changes button rendered (initially disabled because form isn't dirty)
      expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument()

      // Member access section rendered
      expect(screen.getByText('ProjectAccessSection')).toBeInTheDocument()

      // No self-hosted admonition
      expect(screen.queryByText(/configured outside of Studio/i)).not.toBeInTheDocument()
    })
  })

  describe('self-hosted', () => {
    beforeEach(() => {
      mockIsPlatform.value = false
    })

    it('renders the admonition with both docs links and a read-only project name', () => {
      render(<General />)

      // Read-only project name with value populated
      expect(screen.getByText('Project name')).toBeInTheDocument()
      expect(screen.getByDisplayValue('My Project')).toHaveAttribute('readonly')

      // Admonition mentions both docs targets
      expect(screen.getByText(/configured outside of Studio/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /self-hosting guides/i })).toHaveAttribute(
        'href',
        'https://supabase.com/docs/guides/self-hosting'
      )
      expect(screen.getByRole('link', { name: /local development guides/i })).toHaveAttribute(
        'href',
        'https://supabase.com/docs/guides/local-development'
      )
    })

    it('does not render Project ID, region, Save action, or the member access section', () => {
      render(<General />)

      expect(screen.queryByText('Project ID')).not.toBeInTheDocument()
      expect(screen.queryByText('Project region')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Save changes/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument()
      expect(screen.queryByText('ProjectAccessSection')).not.toBeInTheDocument()
    })
  })
})
