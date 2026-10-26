import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SignInForm } from './SignInForm'
import { customRender } from '@/tests/lib/custom-render'

const { resolveCaptchaTokenMock } = vi.hoisted(() => ({
  resolveCaptchaTokenMock: vi.fn(),
}))

vi.mock('./SignIn.utils', () => ({
  resolveCaptchaToken: resolveCaptchaTokenMock,
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
}))

vi.mock('@/lib/telemetry/use-track-funnel-error', () => ({
  useTrackFunnelError: () => vi.fn(),
}))

vi.mock('@hcaptcha/react-hcaptcha', async () => {
  const React = await import('react')
  const HCaptchaMock = React.forwardRef<
    HTMLDivElement,
    { size?: 'normal' | 'invisible'; onVerify?: (token: string) => void }
  >(({ size, onVerify }, _ref) => (
    <div data-testid="hcaptcha" data-size={size}>
      {size === 'normal' && (
        <button
          type="button"
          tabIndex={0}
          onClick={() => onVerify?.('manual-captcha-token')}
        >
          Complete security check
        </button>
      )}
    </div>
  ))
  HCaptchaMock.displayName = 'HCaptchaMock'

  return { default: HCaptchaMock }
})

describe('SignInForm', () => {
  beforeEach(() => {
    resolveCaptchaTokenMock.mockResolvedValue({ ok: false })
  })

  test('shows an interactive captcha when the invisible challenge fails', async () => {
    customRender(<SignInForm />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password' },
    })
    fireEvent.submit(document.getElementById('sign-in-form')!)

    await waitFor(() => expect(resolveCaptchaTokenMock).toHaveBeenCalled())

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Complete the security check, then select Sign in.'
    )
    expect(screen.getByTestId('hcaptcha')).toHaveAttribute('data-size', 'normal')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Complete security check' }))

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })
})
