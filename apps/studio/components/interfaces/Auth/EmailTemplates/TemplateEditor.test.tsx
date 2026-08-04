import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TEMPLATES_SCHEMAS } from './AuthTemplatesValidation'
import { TemplateEditor } from './TemplateEditor'
import { render } from '@/tests/helpers'

const {
  resetTemplateMock,
  updateAuthConfigMock,
  useAuthConfigQueryMock,
  useAuthTemplateResetMutationMock,
  useAuthConfigUpdateMutationMock,
  useAsyncCheckPermissionsMock,
  validateSpamMock,
} = vi.hoisted(() => ({
  resetTemplateMock: vi.fn(),
  updateAuthConfigMock: vi.fn(),
  useAuthConfigQueryMock: vi.fn(),
  useAuthTemplateResetMutationMock: vi.fn(),
  useAuthConfigUpdateMutationMock: vi.fn(),
  useAsyncCheckPermissionsMock: vi.fn(),
  validateSpamMock: vi.fn(),
}))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ ref: 'project-ref' }),
  }
})

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onInputChange,
  }: {
    value: string
    onInputChange: (value: string) => void
  }) => (
    <textarea
      aria-label="Body source"
      value={value}
      onChange={(event) => onInputChange(event.target.value)}
    />
  ),
}))

vi.mock('@/components/ui-patterns/Dialogs/PreventNavigationOnUnsavedChanges', () => ({
  PreventNavigationOnUnsavedChanges: () => null,
}))

vi.mock('@/data/auth/auth-config-query', () => ({
  useAuthConfigQuery: useAuthConfigQueryMock,
}))

vi.mock('@/data/auth/auth-config-update-mutation', () => ({
  useAuthConfigUpdateMutation: useAuthConfigUpdateMutationMock,
}))

vi.mock('@/data/auth/auth-template-reset-mutation', () => ({
  useAuthTemplateResetMutation: useAuthTemplateResetMutationMock,
}))

vi.mock('@/data/auth/validate-spam-mutation', () => ({
  useValidateSpamMutation: () => ({ mutate: validateSpamMock }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: useAsyncCheckPermissionsMock,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const confirmationTemplate = TEMPLATES_SCHEMAS.find((template) => template.id === 'CONFIRMATION')!

const createAuthConfig = ({
  subject = 'Confirm your email address',
  body,
  hasCustomBody,
  hasCustomSubject = false,
}: {
  subject?: string
  body: string
  hasCustomBody: boolean
  hasCustomSubject?: boolean
}) => ({
  MAILER_SUBJECTS_CONFIRMATION: subject,
  MAILER_SUBJECTS_CUSTOM_CONTENTS: {
    MAILER_SUBJECTS_CONFIRMATION: hasCustomSubject,
  },
  MAILER_TEMPLATES_CONFIRMATION_CONTENT: body,
  MAILER_TEMPLATES_CUSTOM_CONTENTS: {
    MAILER_TEMPLATES_CONFIRMATION_CONTENT: hasCustomBody,
  },
  SMTP_HOST: 'smtp.example.com',
  SMTP_PASS: 'password',
  SMTP_USER: 'user',
})

const renderTemplateEditor = ({
  body = '<p>Default template</p>',
  canUpdateConfig = true,
  hasCustomBody = false,
  hasCustomSubject = false,
}: {
  body?: string
  canUpdateConfig?: boolean
  hasCustomBody?: boolean
  hasCustomSubject?: boolean
} = {}) => {
  useAuthConfigQueryMock.mockReturnValue({
    data: createAuthConfig({ body, hasCustomBody, hasCustomSubject }),
    isSuccess: true,
  })
  useAsyncCheckPermissionsMock.mockReturnValue({ can: canUpdateConfig })
  useAuthConfigUpdateMutationMock.mockReturnValue({ mutate: updateAuthConfigMock })
  useAuthTemplateResetMutationMock.mockImplementation((options = {}) => ({
    mutateAsync: (vars: unknown) => resetTemplateMock(vars, options),
    isPending: false,
  }))

  return render(<TemplateEditor template={confirmationTemplate} />)
}

describe('TemplateEditor reset to default', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateSpamMock.mockImplementation((_vars, callbacks) => callbacks?.onSuccess?.({ rules: [] }))
  })

  const resetAuthConfig = createAuthConfig({
    subject: 'Confirm your email address',
    body: '<h2>Confirm your email address</h2>\n\n<p>Follow the link below to confirm this email address and finish signing up.</p>\n<p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>',
    hasCustomBody: false,
    hasCustomSubject: false,
  })

  it('hides reset when the API does not mark the body as custom', () => {
    renderTemplateEditor()

    expect(screen.queryByRole('button', { name: 'Reset template' })).not.toBeInTheDocument()
  })

  it('shows reset when the API marks the body as custom', () => {
    renderTemplateEditor({ hasCustomBody: true })

    expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
  })

  it('shows reset when the API marks the subject as custom', () => {
    renderTemplateEditor({ hasCustomSubject: true })

    expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
  })

  it('keeps reset visible while there are unsaved editor changes', async () => {
    const user = userEvent.setup()
    renderTemplateEditor({ hasCustomBody: true })

    await user.clear(screen.getByLabelText('Body source'))
    await user.type(screen.getByLabelText('Body source'), '<p>Unsaved body</p>')

    expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
  })

  it('warns that reset discards unsaved changes', async () => {
    const user = userEvent.setup()
    renderTemplateEditor({ hasCustomBody: true })

    await user.clear(screen.getByLabelText('Body source'))
    await user.type(screen.getByLabelText('Body source'), '<p>Unsaved body</p>')
    await user.click(screen.getByRole('button', { name: 'Reset template' }))

    expect(
      await screen.findByText(
        'This will discard your unsaved changes and use the default subject line and email body content.'
      )
    ).toBeInTheDocument()
  })

  it('resets the template through the dedicated reset endpoint after confirmation', async () => {
    const user = userEvent.setup()
    resetTemplateMock.mockImplementation((_vars, callbacks) =>
      callbacks?.onSuccess?.(resetAuthConfig)
    )

    renderTemplateEditor({ hasCustomBody: true })

    await user.click(screen.getByRole('button', { name: 'Reset template' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }))

    await waitFor(() =>
      expect(resetTemplateMock).toHaveBeenCalledWith(
        { projectRef: 'project-ref', template: 'confirmation' },
        expect.any(Object)
      )
    )

    expect(toast.success).toHaveBeenCalledWith('Email template reset to default')
  })

  it('does not reset through the auth config update payload', async () => {
    const user = userEvent.setup()
    resetTemplateMock.mockImplementation((_vars, callbacks) =>
      callbacks?.onSuccess?.(resetAuthConfig)
    )

    renderTemplateEditor({ hasCustomBody: true })

    await user.click(screen.getByRole('button', { name: 'Reset template' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }))

    await waitFor(() => expect(resetTemplateMock).toHaveBeenCalled())

    expect(updateAuthConfigMock).not.toHaveBeenCalled()
  })

  it('uses the reset response as the new editor state', async () => {
    const user = userEvent.setup()
    resetTemplateMock.mockImplementation((_vars, callbacks) =>
      callbacks?.onSuccess?.(resetAuthConfig)
    )

    renderTemplateEditor({
      body: '<p>Custom body</p>',
      hasCustomBody: true,
      hasCustomSubject: true,
    })

    await user.click(screen.getByRole('button', { name: 'Reset template' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Confirm your email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Body source')).toHaveValue(
        '<h2>Confirm your email address</h2>\n\n<p>Follow the link below to confirm this email address and finish signing up.</p>\n<p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>'
      )
    })
  })

  it('disables reset when the user cannot update auth config', () => {
    renderTemplateEditor({ hasCustomBody: true, canUpdateConfig: false })

    expect(screen.getByRole('button', { name: 'Reset template' })).toBeDisabled()
  })

  it('keeps the dialog open and shows an inline error when reset fails', async () => {
    const user = userEvent.setup()
    resetTemplateMock.mockImplementation(async () => {
      throw new Error('Reset endpoint unavailable')
    })

    renderTemplateEditor({ hasCustomBody: true })

    await user.click(screen.getByRole('button', { name: 'Reset template' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }))

    expect(await within(dialog).findByText('Reset endpoint unavailable')).toBeInTheDocument()
    expect(within(dialog).getByText('Unable to reset email template')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Reset' })).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
