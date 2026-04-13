import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorMatcher } from './ErrorMatcher'
import { ConnectionTimeoutError } from '@/types/api-errors'
import { ResponseError } from '@/types/base'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))
vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({ newChat: vi.fn() }),
}))
vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({ openSidebar: vi.fn() }),
}))
vi.mock('@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider', () => ({
  SIDEBAR_KEYS: { AI_ASSISTANT: 'ai-assistant' },
}))
vi.mock('./RestartProjectDialog', () => ({
  RestartProjectDialog: () => null,
}))

describe('ErrorMatcher', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the provided title and error message', () => {
    render(
      <ErrorMatcher
        title="Failed to load tables"
        error="ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT."
        supportFormParams={{}}
      />
    )
    expect(screen.getByText('Failed to load tables')).toBeInTheDocument()
    expect(
      screen.getByText(
        'ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT.'
      )
    ).toBeInTheDocument()
  })

  it('renders troubleshooting steps for classified errors', () => {
    const error = new ConnectionTimeoutError('CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT')
    render(<ErrorMatcher title="Failed to load tables" error={error} supportFormParams={{}} />)
    expect(screen.getByText('Try restarting your project')).toBeInTheDocument()
    expect(screen.getByText('Try our troubleshooting guide')).toBeInTheDocument()
    expect(screen.getByText('Debug with AI')).toBeInTheDocument()
  })

  it('renders fallback for plain ResponseError (not a classified subclass)', () => {
    render(
      <ErrorMatcher
        title="Failed to load tables"
        error={new ResponseError('CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT')}
        supportFormParams={{}}
      />
    )
    expect(screen.getByText('Failed to load tables')).toBeInTheDocument()
    expect(screen.queryByText('Try restarting your project')).not.toBeInTheDocument()
  })

  it('renders fallback with provided title for unmatched errors', () => {
    render(
      <ErrorMatcher title="Failed to load tables" error="UNKNOWN ERROR" supportFormParams={{}} />
    )
    expect(screen.getByText('Failed to load tables')).toBeInTheDocument()
    expect(screen.getByText('UNKNOWN ERROR')).toBeInTheDocument()
  })

  it('accepts error as object with message property', () => {
    render(
      <ErrorMatcher
        title="Failed to load tables"
        error={{ message: 'UNKNOWN ERROR' }}
        supportFormParams={{}}
      />
    )
    expect(screen.getByText('UNKNOWN ERROR')).toBeInTheDocument()
  })

  it('builds support link with projectRef param', () => {
    render(
      <ErrorMatcher
        title="Failed to load tables"
        error="UNKNOWN ERROR"
        supportFormParams={{ projectRef: 'my-project' }}
      />
    )
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      '/support/new?projectRef=my-project'
    )
  })

  it('builds support link with no params when supportFormParams is omitted', () => {
    render(<ErrorMatcher title="Failed to load tables" error="UNKNOWN ERROR" />)
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      '/support/new'
    )
  })
})
