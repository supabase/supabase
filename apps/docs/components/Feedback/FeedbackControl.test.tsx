// @vitest-environment jsdom
import './test-utils/dom-stubs'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { TelemetryEvent } from 'common/telemetry-constants'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FeedbackControl } from './Feedback'
import { FeedbackDockProvider, useFeedbackDock } from './FeedbackDockProvider'
import { resetDomStubs } from './test-utils/dom-stubs'

const mocks = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  pathname: '/guides/auth',
  hasClient: true,
  isEnabled: true,
}))

vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => mocks.sendTelemetryEvent }))

vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }))

vi.mock('~/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => (mocks.hasClient ? {} : undefined),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  isFeatureEnabled: () => mocks.isEnabled,
}))

vi.mock('./useSendDocsFeedback', () => ({ useSendDocsFeedback: () => ({ mutate: vi.fn() }) }))

// stands in for the next/dynamic dock
const DockProbe = () => {
  const { state, actions } = useFeedbackDock()
  const handleOtherPageOpen = () =>
    actions.openDock({ vote: 'no', page: { pathname: '/guides/other' } })

  return (
    <>
      <output data-testid="dock">
        {state.isOpen ? `${state.vote} ${state.targetPage?.pathname}` : 'closed'}
      </output>
      <button type="button" tabIndex={0} onClick={handleOtherPageOpen}>
        Open for other page
      </button>
    </>
  )
}

const renderControl = (children = <FeedbackControl />) =>
  render(
    <TooltipProvider delayDuration={0}>
      <FeedbackDockProvider>
        {children}
        <DockProbe />
      </FeedbackDockProvider>
    </TooltipProvider>
  )

const getYes = () => screen.getByRole('button', { name: 'Yes, this page helped' })
const getNo = () => screen.getByRole('button', { name: "No, this page didn't help" })
const getBug = () => screen.getByRole('link', { name: 'Report a bug on GitHub' })
const getDock = () => screen.getByTestId('dock').textContent

const getEvents = (action: TelemetryEvent['action']) =>
  mocks.sendTelemetryEvent.mock.calls
    .map(([event]: [TelemetryEvent]) => event)
    .filter((event) => event.action === action)

beforeEach(() => {
  mocks.pathname = '/guides/auth'
  mocks.hasClient = true
  mocks.isEnabled = true
})

afterEach(() => {
  cleanup()
  resetDomStubs()
  vi.clearAllMocks()
})

describe('FeedbackControl', () => {
  it('opens the dock for this page with a no vote and sends one click event', () => {
    renderControl()

    fireEvent.click(getNo())

    expect(getDock()).toBe('no /guides/auth')
    expect(getEvents('docs_feedback_clicked')).toEqual([
      { action: 'docs_feedback_clicked', properties: { response: 'no' } },
    ])
  })

  it('tracks the bug link without opening the dock', () => {
    renderControl()

    fireEvent.click(getBug())

    expect(getEvents('docs_feedback_bug_report_clicked')).toEqual([
      { action: 'docs_feedback_bug_report_clicked' },
    ])
    expect(getEvents('docs_feedback_clicked')).toEqual([])
    expect(getDock()).toBe('closed')
  })

  it('marks the vote pressed only while the dock targets this page', () => {
    renderControl()
    expect(getNo().getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(getNo())
    expect(getNo().getAttribute('aria-pressed')).toBe('true')
    expect(getYes().getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: 'Open for other page' }))
    expect(getNo().getAttribute('aria-pressed')).toBe('false')
    expect(getYes().getAttribute('aria-pressed')).toBe('false')
  })

  it('renders only the bug link when feedback cannot be sent', () => {
    mocks.hasClient = false
    renderControl()

    expect(screen.queryByRole('button', { name: /this page/ })).toBeNull()
    expect(getBug()).toBeTruthy()
  })

  it('renders nothing when the feature flag is off', () => {
    mocks.isEnabled = false
    renderControl()

    expect(screen.queryByText('Is this page helpful?')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Report a bug on GitHub' })).toBeNull()
  })

  it('hands the vote to onVote instead of opening the dock', () => {
    const handleVote = vi.fn()
    renderControl(<FeedbackControl onVote={handleVote} />)

    fireEvent.click(getYes())

    expect(handleVote).toHaveBeenCalledWith({
      vote: 'yes',
      page: { pathname: '/guides/auth' },
    })
    expect(getDock()).toBe('closed')
    expect(getEvents('docs_feedback_clicked')).toHaveLength(1)
  })
})
