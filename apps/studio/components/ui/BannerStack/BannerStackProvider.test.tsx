import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BANNER_ID, BannerStackProvider, useBannerStack } from './BannerStackProvider'

function BannerStackTestConsumer() {
  const { addBanner, banners, dismissBanner } = useBannerStack()

  return (
    <>
      <button
        type="button"
        onClick={() =>
          addBanner({
            id: BANNER_ID.ONBOARDING_SURVEY,
            isDismissed: false,
            content: <span>Survey</span>,
          })
        }
      >
        Add banner
      </button>
      <button type="button" onClick={() => dismissBanner(BANNER_ID.ONBOARDING_SURVEY)}>
        Dismiss banner
      </button>
      <div data-testid="banner-state">
        {banners.map((banner) => `${banner.id}:${banner.isDismissed ? 'dismissed' : 'active'}`)}
      </div>
    </>
  )
}

describe('BannerStackProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('revives an existing dismissed banner when it is re-added before removal', () => {
    vi.useFakeTimers()

    render(
      <BannerStackProvider>
        <BannerStackTestConsumer />
      </BannerStackProvider>
    )

    act(() => screen.getByText('Add banner').click())
    expect(screen.getByTestId('banner-state').textContent).toBe('onboarding-survey-banner:active')

    act(() => screen.getByText('Dismiss banner').click())
    expect(screen.getByTestId('banner-state').textContent).toBe(
      'onboarding-survey-banner:dismissed'
    )

    act(() => screen.getByText('Add banner').click())
    expect(screen.getByTestId('banner-state').textContent).toBe('onboarding-survey-banner:active')

    act(() => vi.advanceTimersByTime(300))
    expect(screen.getByTestId('banner-state').textContent).toBe('onboarding-survey-banner:active')
  })
})
