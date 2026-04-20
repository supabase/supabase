import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProviderForm } from './ProviderForm'
import type { Provider } from './AuthProvidersForm.types'
import { getPhoneProviderValidationSchema, PROVIDER_PHONE } from '../AuthProvidersFormValidation'
import type { ProjectAuthConfigData } from '@/data/auth/auth-config-query'
import { customRender } from '@/tests/lib/custom-render'

const {
  updateAuthConfigMutateMock,
} = vi.hoisted(() => ({
  updateAuthConfigMutateMock: vi.fn(),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as object

  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
  }
})

vi.mock('@/data/auth/auth-config-update-mutation', () => ({
  useAuthConfigUpdateMutation: () => ({
    mutate: updateAuthConfigMutateMock,
    isPending: false,
  }),
}))

vi.mock('@/data/config/project-endpoint-query', () => ({
  useProjectApiUrl: () => ({ data: 'http://localhost:54321' }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'test-org' } }),
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useHasEntitlementAccess: () => () => true,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('./AuthAlert', () => ({
  AuthAlert: () => null,
}))

vi.mock('@/components/ui/DocsButton', () => ({
  DocsButton: ({ href }: { href: string }) => <a href={href}>Docs</a>,
}))

vi.mock('@/components/ui/ButtonTooltip', () => ({
  ButtonTooltip: ({
    children,
    htmlType,
    loading: _loading,
    tooltip: _tooltip,
    ...props
  }: {
    children: React.ReactNode
    htmlType?: 'button' | 'submit' | 'reset'
    loading?: boolean
    tooltip?: unknown
    [key: string]: unknown
  }) => (
    <button type={htmlType} {...props}>
      {children}
    </button>
  ),
}))

mockAnimationsApi()

function createPhoneAuthConfig(overrides: Partial<ProjectAuthConfigData> = {}): ProjectAuthConfigData {
  return {
    DISABLE_SIGNUP: false,
    EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
    SECURITY_MANUAL_LINKING_ENABLED: false,
    MAILER_AUTOCONFIRM: false,
    SITE_URL: 'http://localhost:3000',
    SECURITY_CAPTCHA_ENABLED: false,
    EXTERNAL_EMAIL_ENABLED: true,
    MAILER_OTP_EXP: 300,
    HOOK_SEND_SMS_ENABLED: false,
    EXTERNAL_PHONE_ENABLED: false,
    SMS_PROVIDER: '',
    SMS_AUTOCONFIRM: false,
    SMS_OTP_EXP: 300,
    SMS_OTP_LENGTH: 6,
    SMS_TEMPLATE: 'Your code is {{ .Code }}',
    SMS_TEST_OTP: '18005550123=789012',
    SMS_TEST_OTP_VALID_UNTIL: '2030-01-01T00:00:00.000Z',
    SMS_TWILIO_ACCOUNT_SID: null,
    SMS_TWILIO_AUTH_TOKEN: null,
    SMS_TWILIO_MESSAGE_SERVICE_SID: null,
    ...overrides,
  } as ProjectAuthConfigData
}

function createPhoneProvider(config: ProjectAuthConfigData): Provider {
  return {
    ...PROVIDER_PHONE,
    validationSchema: getPhoneProviderValidationSchema(config),
  } as unknown as Provider
}

function renderPhoneProvider(config: ProjectAuthConfigData) {
  return customRender(
    <ProviderForm
      config={config}
      provider={createPhoneProvider(config)}
      isActive={config.EXTERNAL_PHONE_ENABLED === true}
    />,
    {
      nuqs: {
        searchParams: {},
      },
    }
  )
}

function getElementByIdOrThrow<T extends HTMLElement>(container: HTMLElement, id: string): T {
  const element = container.querySelector(`#${id}`)

  if (element == null) {
    throw new Error(`Expected to find element #${id}`)
  }

  return element as T
}

async function openPhoneSheet() {
  await userEvent.click(screen.getByText('Phone'))
  return await screen.findByRole('dialog', { name: 'Phone' })
}

describe('ProviderForm', () => {
  let currentConfig: ProjectAuthConfigData

  beforeEach(() => {
    currentConfig = createPhoneAuthConfig({
      SMS_PROVIDER: 'twilio',
      SMS_OTP_EXP: 300,
      SMS_OTP_LENGTH: 6,
      SMS_TEMPLATE: 'Your code is {{ .Code }}',
      SMS_TWILIO_ACCOUNT_SID: 'AC123456789',
      SMS_TWILIO_AUTH_TOKEN: 'auth-token',
      SMS_TWILIO_MESSAGE_SERVICE_SID: 'MG123456789',
    })
    updateAuthConfigMutateMock.mockReset()
    updateAuthConfigMutateMock.mockImplementation(() => {})
  })

  it('reflects the saved phone provider enabled state and config after rerendering with updated values', async () => {
    const user = userEvent.setup()
    const view = renderPhoneProvider(currentConfig)

    let dialog = await openPhoneSheet()

    const enablePhoneSwitch = getElementByIdOrThrow<HTMLButtonElement>(dialog, 'EXTERNAL_PHONE_ENABLED')
    expect(enablePhoneSwitch).toHaveAttribute('aria-checked', 'false')

    expect(getElementByIdOrThrow<HTMLInputElement>(dialog, 'SMS_TWILIO_ACCOUNT_SID')).toHaveValue(
      'AC123456789'
    )
    expect(getElementByIdOrThrow<HTMLInputElement>(dialog, 'SMS_TWILIO_AUTH_TOKEN')).toHaveValue(
      'auth-token'
    )
    expect(
      getElementByIdOrThrow<HTMLInputElement>(dialog, 'SMS_TWILIO_MESSAGE_SERVICE_SID')
    ).toHaveValue('MG123456789')
    expect(getElementByIdOrThrow<HTMLInputElement>(dialog, 'SMS_OTP_EXP')).toHaveValue(300)
    expect(getElementByIdOrThrow<HTMLInputElement>(dialog, 'SMS_OTP_LENGTH')).toHaveValue(6)
    expect(getElementByIdOrThrow<HTMLTextAreaElement>(dialog, 'SMS_TEMPLATE')).toHaveValue(
      'Your code is {{ .Code }}'
    )

    currentConfig = {
      ...currentConfig,
      EXTERNAL_PHONE_ENABLED: true,
    }

    view.rerender(
      <ProviderForm
        config={currentConfig}
        provider={createPhoneProvider(currentConfig)}
        isActive={currentConfig.EXTERNAL_PHONE_ENABLED === true}
      />
    )

    expect(
      getElementByIdOrThrow<HTMLButtonElement>(dialog, 'EXTERNAL_PHONE_ENABLED')
    ).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Enabled')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    dialog = await openPhoneSheet()
    expect(
      getElementByIdOrThrow<HTMLButtonElement>(dialog, 'EXTERNAL_PHONE_ENABLED')
    ).toHaveAttribute('aria-checked', 'true')
    expect(within(dialog).getAllByRole('combobox')[0]).toHaveTextContent('Twilio')
    expect(
      getElementByIdOrThrow<HTMLInputElement>(dialog, 'SMS_TWILIO_ACCOUNT_SID')
    ).toHaveValue('AC123456789')
  })
})
