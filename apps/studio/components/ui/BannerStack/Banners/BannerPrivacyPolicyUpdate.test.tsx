import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { BannerStackProvider } from '../BannerStackProvider'
import { BannerPrivacyPolicyUpdate } from './BannerPrivacyPolicyUpdate'

const renderBanner = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <BannerStackProvider>{children}</BannerStackProvider>
    </QueryClientProvider>
  )

  return render(<BannerPrivacyPolicyUpdate />, { wrapper: Wrapper })
}

describe('BannerPrivacyPolicyUpdate', () => {
  beforeEach(() => window.localStorage.clear())

  it('shows the compact notice and the full update details', async () => {
    renderBanner()

    expect(screen.getByText("We've updated our Privacy Policy")).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Learn more' }))

    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      'https://supabase.com/privacy'
    )
    expect(screen.getByRole('link', { name: 'contact us' })).toHaveAttribute(
      'href',
      'mailto:privacy@supabase.com'
    )
  })

  it('persists acknowledgement from the dialog', async () => {
    renderBanner()

    fireEvent.click(screen.getByRole('button', { name: 'Learn more' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Understood' }))

    await waitFor(() =>
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEYS.PRIVACY_POLICY_UPDATE)).toBe('true')
    )
  })
})
