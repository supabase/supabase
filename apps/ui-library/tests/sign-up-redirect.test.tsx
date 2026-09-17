import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SignUpForm } from '@/registry/default/blocks/password-based-auth-tanstack/components/sign-up-form'

import '@/registry/default/blocks/password-based-auth-tanstack/routes/auth/confirm'

const { signUp, navigate, verifyOtp, confirm } = vi.hoisted(() => ({
  signUp: vi.fn(),
  navigate: vi.fn(),
  verifyOtp: vi.fn(),
  confirm: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useNavigate: () => navigate,
  createFileRoute: () => (options: unknown) => options,
  redirect: (options: unknown) => options,
}))
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (handler: (ctx: { data: Record<string, unknown> }) => Promise<unknown>) => {
        confirm.mockImplementation(handler)
        return confirm
      },
    }),
  }),
}))
vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => new Request('https://app.example.com/auth/confirm'),
}))
vi.mock('@/registry/default/clients/tanstack/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signUp } }),
}))
vi.mock('@/registry/default/clients/tanstack/lib/supabase/server', () => ({
  createClient: () => ({ auth: { verifyOtp } }),
}))

const origin = 'https://app.example.com'
let container: HTMLDivElement
let root: Root
let location: { origin: string; search: string; assign: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  location = { origin, search: '', assign: vi.fn() }
  const testWindow = Object.create(window)
  Object.defineProperty(testWindow, 'location', { value: location })
  vi.stubGlobal('window', testWindow)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  verifyOtp.mockResolvedValue({ error: null })
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

async function submit(next: string | null) {
  location.search = next === null ? '' : `?${new URLSearchParams({ next })}`
  await act(async () => root.render(<SignUpForm />))
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  for (const [id, value] of [
    ['email', 'user@example.com'],
    ['password', 'test-password'],
    ['repeat-password', 'test-password'],
  ]) {
    await act(async () => {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!
      setValue.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  await act(async () => {
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

const destinations = [
  ['/oauth/consent?authorization_id=request-123', '/oauth/consent?authorization_id=request-123'],
  ['/agents?tab=connected&sort=name#tools', '/agents?tab=connected&sort=name#tools'],
  [null, '/protected'],
  ['', '/protected'],
  ['https://evil.example/agents', '/protected'],
  ['//evil.example/agents', '/protected'],
  ['/\\evil.example/agents', '/protected'],
] as const

describe.each([false, true])('Sign-up redirects with immediate session: %s', (hasSession) => {
  it.each(destinations)('validates destination %s before sign-up', async (next, expected) => {
    signUp.mockImplementation(async () => {
      // A pending auth request must not pick up a subsequently changed destination.
      location.search = '?next=/changed'
      return { data: { session: hasSession ? { access_token: 'test-token' } : null }, error: null }
    })
    await submit(next)
    expect(signUp).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'test-password',
      options: { emailRedirectTo: `${origin}${expected}` },
    })
    if (hasSession) {
      expect(location.assign).toHaveBeenCalledWith(expected)
      expect(navigate).not.toHaveBeenCalled()
    } else {
      expect(location.assign).not.toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-up-success' })
      await expect(
        confirm({ data: { token_hash: 'test-hash', type: 'email', next: `${origin}${expected}` } })
      ).rejects.toEqual({ href: expected })
      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'test-hash', type: 'email' })
    }
  })
})

it.each([
  ['/agents', '/agents'],
  ['//evil.example/agents', '/'],
  ['/\\evil.example/agents', '/'],
  ['https://evil.example/agents', '/'],
  [`${origin}.evil.example/agents`, '/'],
  [`${origin}//evil.example/agents`, '/'],
])('validates confirmation destination %s', async (next, expected) => {
  await expect(confirm({ data: { token_hash: 'test-hash', type: 'email', next } })).rejects.toEqual(
    { href: expected }
  )
})
