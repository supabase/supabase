import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InviteMemberButton } from '@/components/interfaces/Organization/TeamSettings/InviteMemberButton'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useParams: () => ({ slug: 'test-org' }) }
})

vi.mock('@/lib/profile', () => ({
  useProfile: () => ({ profile: { id: 1, gotrue_id: 'user-1' } }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({
    data: { id: 1, slug: 'test-org', name: 'Test Org' },
  }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useGetPermissions: () => ({ permissions: [], organizationSlug: 'test-org' }),
  doPermissionsCheck: () => true,
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({ organizationMembersCreate: true }),
}))

vi.mock('@/data/organizations/organization-members-query', () => ({
  useOrganizationMembersQuery: () => ({
    data: [
      {
        gotrue_id: 'user-1',
        primary_email: 'me@example.com',
        role_ids: [1],
      },
      {
        gotrue_id: 'existing-user',
        primary_email: 'existing@example.com',
        role_ids: [1],
      },
    ],
  }),
}))

const mockRoles = {
  org_scoped_roles: [{ id: 1, name: 'Developer', description: null }],
}
vi.mock('@/data/organization-members/organization-roles-query', () => ({
  useOrganizationRolesV2Query: () => ({ data: mockRoles, isSuccess: true }),
}))

vi.mock('@/data/sso/sso-config-query', () => ({
  useOrgSSOConfigQuery: () => ({ data: null }),
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useHasAccessToProjectLevelPermissions: () => false,
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ hasAccess: false }),
}))

vi.mock('@/components/interfaces/Organization/TeamSettings/TeamSettings.utils', () => ({
  useGetRolesManagementPermissions: () => ({ rolesAddable: [1], rolesRemovable: [1] }),
}))

const mockInvite = vi.fn().mockResolvedValue({ succeeded: [], failed: [] })
vi.mock('@/data/organization-members/organization-invitation-create-mutation', () => ({
  useOrganizationCreateInvitationMutation: () => ({
    mutateAsync: mockInvite,
    isPending: false,
  }),
}))

vi.mock('@/hooks/ui/useConfirmOnClose', () => ({
  useConfirmOnClose: ({ onClose }: { checkIsDirty: () => boolean; onClose: () => void }) => ({
    confirmOnClose: onClose,
    handleOpenChange: (open: boolean) => {
      if (!open) onClose()
    },
    modalProps: { visible: false, onClose, onCancel: vi.fn() },
  }),
}))

// Helpers
async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: /invite members/i }))
  return screen.findByRole('dialog')
}

async function submitForm(emailValue: string) {
  await openDialog()
  fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
    target: { value: emailValue },
  })
  fireEvent.click(screen.getByRole('button', { name: /send invitation/i }))
}

// Tests
describe('InviteMemberButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvite.mockResolvedValue({ succeeded: [], failed: [] })
  })

  it('renders an enabled Invite members button', () => {
    customRender(<InviteMemberButton />)
    expect(screen.getByRole('button', { name: /invite members/i })).toBeEnabled()
  })

  it('opens the invite dialog when the button is clicked', async () => {
    customRender(<InviteMemberButton />)
    await openDialog()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Invite team members')).toBeInTheDocument()
  })

  it('calls the mutation with a single email in an array', async () => {
    customRender(<InviteMemberButton />)
    await submitForm('new@example.com')

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith(
        expect.objectContaining({ emails: ['new@example.com'] })
      )
    })
  })

  it('calls the mutation with multiple emails parsed from a comma-separated input', async () => {
    customRender(<InviteMemberButton />)
    await submitForm('alice@example.com, bob@example.com, carol@example.com')

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          emails: ['alice@example.com', 'bob@example.com', 'carol@example.com'],
        })
      )
    })
  })

  it('lowercases emails before sending', async () => {
    customRender(<InviteMemberButton />)
    await submitForm('User@Example.COM')

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith(
        expect.objectContaining({ emails: ['user@example.com'] })
      )
    })
  })

  it('shows a validation error for an invalid email', async () => {
    customRender(<InviteMemberButton />)
    await openDialog()
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }))

    expect(await screen.findByText(/invalid email address: "not-an-email"/i)).toBeInTheDocument()
    expect(mockInvite).not.toHaveBeenCalled()
  })

  it('shows an error toast and skips the mutation for an already-existing member', async () => {
    customRender(<InviteMemberButton />)
    await submitForm('existing@example.com')

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'existing@example.com is already in this organization'
      )
    })
    expect(mockInvite).not.toHaveBeenCalled()
  })

  it('still invites new emails in a batch that also contains an existing member', async () => {
    customRender(<InviteMemberButton />)
    await submitForm('new@example.com, existing@example.com')

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
      expect(mockInvite).toHaveBeenCalledWith(
        expect.objectContaining({ emails: ['new@example.com'] })
      )
    })
  })

  it('shows a success toast for a single email in succeeded', async () => {
    mockInvite.mockResolvedValueOnce({ succeeded: ['new@example.com'], failed: [] })
    customRender(<InviteMemberButton />)
    await submitForm('new@example.com')

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully sent invitation to new member')
    })
  })

  it('shows a plural success toast when multiple emails succeeded', async () => {
    mockInvite.mockResolvedValueOnce({
      succeeded: ['alice@example.com', 'bob@example.com'],
      failed: [],
    })
    customRender(<InviteMemberButton />)
    await submitForm('alice@example.com, bob@example.com')

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully sent invitations to 2 new members')
    })
  })

  it('shows an error toast with the server error for each failed email', async () => {
    mockInvite.mockResolvedValueOnce({
      succeeded: [],
      failed: [{ email: 'new@example.com', error: 'Domain not allowed' }],
    })
    customRender(<InviteMemberButton />)
    await submitForm('new@example.com')

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to invite new@example.com: Domain not allowed'
      )
    })
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('shows both success and error toasts for a partial batch result', async () => {
    mockInvite.mockResolvedValueOnce({
      succeeded: ['alice@example.com'],
      failed: [{ email: 'bob@example.com', error: 'Domain not allowed' }],
    })
    customRender(<InviteMemberButton />)
    await submitForm('alice@example.com, bob@example.com')

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully sent invitation to new member')
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to invite bob@example.com: Domain not allowed'
      )
    })
  })
})
