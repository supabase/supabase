import { PermissionAction } from '@supabase/shared-types/out/constants'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { describe, expect, test, vi } from 'vitest'

import { IndirectTaxDeclarationModal } from '@/components/interfaces/App/IndirectTaxDeclarationModal'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const ORG_SLUG = 'test-org'
const PROFILE_CONTEXT = createMockProfileContext()

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ slug: ORG_SLUG }),
    useIsLoggedIn: () => true,
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const billingWritePermission = {
  actions: [PermissionAction.BILLING_WRITE],
  condition: null,
  organization_id: 1,
  organization_slug: ORG_SLUG,
  project_ids: [],
  project_refs: [],
  resources: ['stripe.customer'],
  restrictive: false,
}

function setupMocks({
  canUpdateBilling = true,
  requiresDeclaration = true,
}: {
  canUpdateBilling?: boolean
  requiresDeclaration?: boolean
} = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [
      createMockOrganizationResponse({
        slug: ORG_SLUG,
        name: 'Test Org',
        requires_indirect_tax_declaration: requiresDeclaration,
      }),
    ],
  })

  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    response: canUpdateBilling ? [billingWritePermission] : [],
  })
}

describe('IndirectTaxDeclarationModal', () => {
  test('is non-dismissible and requires an explicit response', async () => {
    setupMocks()
    customRender(<IndirectTaxDeclarationModal />, { profileContext: PROFILE_CONTEXT })

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Confirm your Australian GST status')
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const submitButton = screen.getByRole('button', { name: 'Submit declaration' })
    expect(submitButton).toBeDisabled()

    await userEvent.hover(submitButton)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Select Yes or No to continue')
  })

  test('submits the declaration', async () => {
    setupMocks()
    const requestBodies: unknown[] = []

    addAPIMock({
      method: 'put',
      path: '/platform/organizations/:slug/customer',
      response: async ({ request }) => {
        requestBodies.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      },
    })

    customRender(<IndirectTaxDeclarationModal />, { profileContext: PROFILE_CONTEXT })

    await userEvent.click(await screen.findByRole('radio', { name: /Yes, I confirm/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit declaration' }))

    await waitFor(() => {
      expect(requestBodies).toEqual([{ indirect_tax_registration_declaration: 'yes' }])
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('transitions to confirmation after submitting from the declaration link', async () => {
    setupMocks()

    addAPIMock({
      method: 'put',
      path: '/platform/organizations/:slug/customer',
      response: () => new HttpResponse(null, { status: 204 }),
    })

    customRender(<IndirectTaxDeclarationModal />, {
      profileContext: PROFILE_CONTEXT,
      nuqs: { searchParams: { submit_indirect_tax_declaration: 'true' } },
    })

    await userEvent.click(await screen.findByRole('radio', { name: /Yes, I confirm/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit declaration' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('GST declaration submitted')
    expect(dialog).toHaveTextContent(
      'The GST declaration for Test Org has been submitted. No further action is required.'
    )
  })

  test('closes after a failed submission without showing the submitted confirmation', async () => {
    setupMocks()

    addAPIMock({
      method: 'put',
      path: '/platform/organizations/:slug/customer',
      response: () => HttpResponse.json({ message: 'Orb update failed' }, { status: 500 }),
    })

    customRender(<IndirectTaxDeclarationModal />, {
      profileContext: PROFILE_CONTEXT,
      nuqs: { searchParams: { submit_indirect_tax_declaration: 'true' } },
    })

    await userEvent.click(await screen.findByRole('radio', { name: /Yes, I confirm/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit declaration' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText('GST declaration submitted')).not.toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith(
      "We couldn't submit your GST declaration. Reload the page and try again.",
      { duration: Infinity }
    )
  })

  test('does not show for members without billing write permission', async () => {
    setupMocks({ canUpdateBilling: false })
    customRender(<IndirectTaxDeclarationModal />, { profileContext: PROFILE_CONTEXT })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('shows a dismissible confirmation when linked after a previous submission', async () => {
    setupMocks({ requiresDeclaration: false })
    customRender(<IndirectTaxDeclarationModal />, {
      profileContext: PROFILE_CONTEXT,
      nuqs: { searchParams: { submit_indirect_tax_declaration: 'true' } },
    })

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('GST declaration submitted')
    expect(dialog).toHaveTextContent(
      'The GST declaration for Test Org has been submitted. No further action is required.'
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'Close' })[0])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('does not show the submitted confirmation without the URL parameter', async () => {
    setupMocks({ requiresDeclaration: false })
    customRender(<IndirectTaxDeclarationModal />, { profileContext: PROFILE_CONTEXT })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
