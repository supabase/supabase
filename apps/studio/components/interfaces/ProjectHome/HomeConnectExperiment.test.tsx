import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HomeConnectExperiment } from './HomeConnectExperiment'

const mocks = vi.hoisted(() => ({
  flagValue: undefined as string | false | undefined,
  hasFlagsForSignedInUser: false,
  hasAcceptedAnalytics: true,
  track: vi.fn(),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mocks.track }))

vi.mock('@/hooks/ui/useFlag', () => ({ usePHFlag: () => mocks.flagValue }))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useFeatureFlags: () => ({
      ...actual.useFeatureFlags(),
      hasFlagsForSignedInUser: mocks.hasFlagsForSignedInUser,
    }),
    useConsentState: () => ({
      ...actual.useConsentState(),
      hasAccepted: mocks.hasAcceptedAnalytics,
    }),
  }
})

vi.mock('./ConnectSection', () => ({ ConnectSection: () => <div>connect tiles</div> }))
vi.mock('./AgentPromptSection', () => ({ AgentPromptSection: () => <div>agent prompt card</div> }))

describe('HomeConnectExperiment', () => {
  beforeEach(() => {
    mocks.flagValue = undefined
    mocks.hasFlagsForSignedInUser = false
    mocks.hasAcceptedAnalytics = true
    mocks.track.mockClear()
  })

  it('renders nothing and tracks nothing until flags are loaded for the signed-in user', () => {
    mocks.flagValue = 'test'

    const { container } = render(<HomeConnectExperiment />)

    expect(container).toBeEmptyDOMElement()
    expect(mocks.track).not.toHaveBeenCalled()
  })

  it('renders the agent prompt card and tracks one exposure for the test variant', () => {
    mocks.flagValue = 'test'
    mocks.hasFlagsForSignedInUser = true

    const { rerender } = render(<HomeConnectExperiment />)
    rerender(<HomeConnectExperiment />)

    expect(screen.getByText('agent prompt card')).toBeInTheDocument()
    expect(mocks.track).toHaveBeenCalledTimes(1)
    expect(mocks.track).toHaveBeenCalledWith('home_connect_section_exposed', {
      experiment_id: 'homeAgentPrompt',
      variant: 'test',
    })
  })

  it('renders the connect tiles and tracks the control variant', () => {
    mocks.flagValue = 'control'
    mocks.hasFlagsForSignedInUser = true

    render(<HomeConnectExperiment />)

    expect(screen.getByText('connect tiles')).toBeInTheDocument()
    expect(mocks.track).toHaveBeenCalledWith('home_connect_section_exposed', {
      experiment_id: 'homeAgentPrompt',
      variant: 'control',
    })
  })

  it.each([false, undefined] as const)(
    'renders the connect tiles and tracks an exposure without a variant when the flag is %s',
    (flagValue) => {
      mocks.flagValue = flagValue
      mocks.hasFlagsForSignedInUser = true

      render(<HomeConnectExperiment />)

      expect(screen.getByText('connect tiles')).toBeInTheDocument()
      expect(mocks.track).toHaveBeenCalledWith('home_connect_section_exposed', {})
    }
  )

  it('tracks the exposure once flags finish loading after the first render', () => {
    mocks.flagValue = 'test'

    const { rerender } = render(<HomeConnectExperiment />)
    expect(mocks.track).not.toHaveBeenCalled()

    mocks.hasFlagsForSignedInUser = true
    rerender(<HomeConnectExperiment />)

    expect(mocks.track).toHaveBeenCalledTimes(1)
    expect(screen.getByText('agent prompt card')).toBeInTheDocument()
  })

  it('keeps the arm it first rendered and recorded when a later flag fetch returns another value', () => {
    mocks.hasFlagsForSignedInUser = true

    const { rerender } = render(<HomeConnectExperiment />)
    mocks.flagValue = 'test'
    rerender(<HomeConnectExperiment />)

    expect(screen.getByText('connect tiles')).toBeInTheDocument()
    expect(screen.queryByText('agent prompt card')).not.toBeInTheDocument()
    expect(mocks.track).toHaveBeenCalledTimes(1)
    expect(mocks.track).toHaveBeenCalledWith('home_connect_section_exposed', {})
  })

  it('tracks the exposure when analytics consent is given after the section rendered', () => {
    mocks.flagValue = 'test'
    mocks.hasFlagsForSignedInUser = true
    mocks.hasAcceptedAnalytics = false

    const { rerender } = render(<HomeConnectExperiment />)
    expect(screen.getByText('agent prompt card')).toBeInTheDocument()
    expect(mocks.track).not.toHaveBeenCalled()

    mocks.hasAcceptedAnalytics = true
    rerender(<HomeConnectExperiment />)

    expect(mocks.track).toHaveBeenCalledTimes(1)
    expect(mocks.track).toHaveBeenCalledWith('home_connect_section_exposed', {
      experiment_id: 'homeAgentPrompt',
      variant: 'test',
    })
  })
})
