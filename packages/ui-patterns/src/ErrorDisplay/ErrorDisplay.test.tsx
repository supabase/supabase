import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorDisplay } from './index'
import type { ErrorDisplayStep } from './index'

function mockContainerWidth(width: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 200,
    top: 0,
    left: 0,
    right: width,
    bottom: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

const steps: ErrorDisplayStep[] = [
  {
    id: 'guide',
    title: 'Check the troubleshooting guide',
    description: 'Step-by-step instructions for connection timeouts.',
    action: { label: 'View guide', href: 'https://supabase.com/docs' },
  },
  {
    id: 'restart',
    title: 'Restart your project',
    description: 'Clears stale connections.',
    action: { label: 'Restart project' },
  },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorDisplay layout switching', () => {
  it('renders the full layout when the container is at or above the breakpoint', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" steps={steps} />)

    expect(screen.getByRole('status')).toHaveAttribute('data-size', 'full')
    expect(screen.getByText('Check the troubleshooting guide')).toBeInTheDocument()
  })

  it('renders the compact layout when the container is below the breakpoint', async () => {
    mockContainerWidth(260)
    render(<ErrorDisplay title="Failed to retrieve tables" steps={steps} />)

    await waitFor(() => expect(screen.getByRole('status')).toHaveAttribute('data-size', 'compact'))
    expect(screen.getByRole('link', { name: /View guide/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restart project' })).toBeInTheDocument()
    expect(screen.queryByText('Check the troubleshooting guide')).not.toBeInTheDocument()
  })

  it('honours an explicit size over the container width', async () => {
    mockContainerWidth(260)
    render(<ErrorDisplay title="Failed to retrieve tables" size="full" steps={steps} />)

    await waitFor(() => expect(screen.getByRole('status')).toHaveAttribute('data-size', 'full'))
  })

  it.each(['info', 'warning'] as const)('uses role="status" for %s', (type) => {
    mockContainerWidth(640)
    render(<ErrorDisplay type={type} title="Approaching connection limit" />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('uses role="alert" for destructive', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay type="destructive" title="Failed to retrieve tables" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('defaults to the info type', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Schema cache is rebuilding" />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders nothing in place of the error when there is no raw error', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Approaching connection limit" description="92 of 100 in use." />)

    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy error details' })).not.toBeInTheDocument()
  })
})

describe('ErrorDisplay error details', () => {
  it('shows the raw error inline in the full layout', () => {
    mockContainerWidth(640)
    render(
      <ErrorDisplay
        size="full"
        title="Failed to retrieve tables"
        error={{ message: 'Connection terminated', requestId: 'req_8f2a91c' }}
      />
    )

    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.getByText('Connection terminated')).toBeInTheDocument()
    expect(screen.getByText('req_8f2a91c')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy error details' })).toBeInTheDocument()
  })

  it('keeps the raw error behind a Details toggle in the compact layout', async () => {
    const user = userEvent.setup()
    mockContainerWidth(640)
    render(
      <ErrorDisplay
        size="compact"
        title="Failed to retrieve tables"
        error={{ message: 'Connection terminated', requestId: 'req_8f2a91c' }}
      />
    )

    expect(screen.queryByText('Connection terminated')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: 'Details' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Connection terminated')).toBeInTheDocument()
    expect(screen.getByText('req_8f2a91c')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy error details' })).toBeInTheDocument()
  })

  it('renders details before the step actions in the compact layout', async () => {
    mockContainerWidth(260)
    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        error={{ message: 'Connection terminated' }}
        steps={steps}
      />
    )

    const details = await screen.findByRole('button', { name: 'Details' })
    const firstAction = screen.getByRole('link', { name: /View guide/ })

    expect(details.compareDocumentPosition(firstAction)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})

describe('ErrorDisplay steps', () => {
  it('numbers steps and renders an accordion when there are two or more', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" steps={steps} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    const trigger = screen.getByRole('button', { name: /Check the troubleshooting guide/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls')
  })

  it('expands the first step by default', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" steps={steps} />)

    expect(screen.getByRole('button', { name: /Check the troubleshooting guide/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('button', { name: /Restart your project/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('reveals a step description only once the step is expanded', async () => {
    const user = userEvent.setup()
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" steps={steps} />)

    expect(screen.getByText('Step-by-step instructions for connection timeouts.')).toBeVisible()
    expect(screen.queryByText('Clears stale connections.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Restart your project/ }))

    expect(screen.getByText('Clears stale connections.')).toBeInTheDocument()
  })

  it('renders a single step inline, without a number or accordion', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Schema cache is rebuilding" steps={[steps[0]]} />)

    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Check the troubleshooting guide/ })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View guide/ })).toBeInTheDocument()
  })

  it('opens the step named by defaultOpenStep', () => {
    mockContainerWidth(640)
    render(
      <ErrorDisplay title="Failed to retrieve tables" steps={steps} defaultOpenStep="restart" />
    )

    expect(screen.getByRole('button', { name: /Restart your project/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('button', { name: /Check the troubleshooting guide/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })
})

describe('ErrorDisplay step actions', () => {
  it('calls the action handler directly, with no inline confirmation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    mockContainerWidth(640)

    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        steps={[{ ...steps[1], action: { ...steps[1].action, onClick } }]}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Restart project' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })
})

describe('ErrorDisplay retry', () => {
  it('shows a pending state and blocks repeat clicks while retrying', async () => {
    const user = userEvent.setup()
    let resolveRetry: (() => void) | undefined
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve
        })
    )
    mockContainerWidth(640)

    render(<ErrorDisplay title="Failed to retrieve tables" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    const retrying = await screen.findByRole('button', { name: 'Retrying...' })
    expect(retrying).toBeDisabled()

    await user.click(retrying)
    expect(onRetry).toHaveBeenCalledTimes(1)

    resolveRetry?.()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled())
  })

  it('renders an icon-only retry button with a label in the compact layout', async () => {
    mockContainerWidth(260)
    render(<ErrorDisplay title="Failed to retrieve tables" onRetry={vi.fn()} />)

    const button = await screen.findByRole('button', { name: 'Try again' })
    expect(button).toHaveTextContent('')
  })
})

describe('ErrorDisplay support footer', () => {
  it.each(['full', 'compact'] as const)('uses the same support copy in the %s layout', (size) => {
    mockContainerWidth(640)
    render(<ErrorDisplay size={size} title="Failed to retrieve tables" />)

    expect(screen.getByText('Still stuck?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument()
  })
})

describe('ErrorDisplay support link', () => {
  it('prefills the support form with the error details', () => {
    mockContainerWidth(640)
    const onContactSupport = vi.fn()
    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        error={{ message: 'Connection terminated', requestId: 'req_8f2a91c' }}
        supportFormParams={{ projectRef: 'my-project' }}
        onContactSupport={onContactSupport}
      />
    )

    const link = screen.getByRole('link', { name: 'Contact support' })
    const url = new URL(link.getAttribute('href') ?? '', 'https://supabase.com')
    expect(url.searchParams.get('projectRef')).toBe('my-project')
    expect(url.searchParams.get('subject')).toBe('Failed to retrieve tables')
    expect(url.searchParams.get('error')).toContain('Connection terminated')
    expect(url.searchParams.get('sid')).toBe('req_8f2a91c')
  })
})
