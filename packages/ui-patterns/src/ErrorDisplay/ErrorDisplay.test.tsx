import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorDisplay } from './index'
import type { ErrorDisplayAction, ErrorDisplayStep } from './index'

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

const actions: ErrorDisplayAction[] = [
  {
    id: 'guide',
    label: 'View guide',
    href: 'https://supabase.com/docs',
  },
  {
    id: 'restart',
    label: 'Restart project',
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
    expect(screen.getByRole('status').firstElementChild).toHaveClass('px-4', 'pb-3', 'pt-4')
  })

  it('always matches Admonition responsive composition', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" actions={actions} />)

    const contentAndActions = screen.getByRole('heading').parentElement?.parentElement

    expect(screen.getByRole('status')).toHaveClass('@container')
    expect(contentAndActions).toHaveClass('flex-col', '@md:flex-row')
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

  it('can hide the icon like Admonition', () => {
    mockContainerWidth(640)
    render(
      <ErrorDisplay
        title="Schema cache is rebuilding"
        icon={<span>Custom icon</span>}
        showIcon={false}
      />
    )

    expect(screen.queryByText('Custom icon')).not.toBeInTheDocument()
  })

  it('renders nothing in place of the error when there is no raw error', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Approaching connection limit" description="92 of 100 in use." />)

    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy error details' })).not.toBeInTheDocument()
  })

  it('centres a title-only fallback instead of leaving it top-aligned', () => {
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" />)

    expect(screen.getByRole('status').firstElementChild).toHaveClass('items-center')
  })
})

describe('ErrorDisplay sizing', () => {
  it('sizes to the container rather than forcing w-full, so margins do not overflow', () => {
    mockContainerWidth(260)
    render(<ErrorDisplay title="Failed to load tables" className="mx-4 mt-3" />)

    const root = screen.getByRole('status')
    expect(root).not.toHaveClass('w-full')
    expect(root).toHaveClass('w-auto')
    expect(root).toHaveClass('min-w-0')
    expect(root).toHaveClass('mx-4')
  })
})

describe('ErrorDisplay error details', () => {
  it('shows the raw error and request metadata together', () => {
    mockContainerWidth(640)
    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        error={{ message: 'Connection terminated', requestId: 'req_8f2a91c' }}
      />
    )

    const details = screen.getByText(/Connection terminated/)
    expect(details).toBeInTheDocument()
    expect(details).toHaveClass('max-h-20', 'overflow-hidden')
    expect(screen.getByText(/Request ID: req_8f2a91c/)).toBeInTheDocument()
  })

  it('shows the same raw error details in the compact layout', () => {
    mockContainerWidth(260)
    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        error={{ message: 'Connection terminated', requestId: 'req_8f2a91c' }}
      />
    )

    expect(screen.getByText(/Connection terminated/)).toBeInTheDocument()
    expect(screen.getByText(/Request ID: req_8f2a91c/)).toBeInTheDocument()
  })

  it('expands and collapses an overflowing raw error inside its container', async () => {
    const user = userEvent.setup()
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(80)
    mockContainerWidth(640)

    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        error={{ message: 'A verbose database error'.repeat(20) }}
      />
    )

    const details = screen.getByText(/A verbose database error/)
    const showMore = await screen.findByRole('button', { name: 'Show more' })

    expect(details).toHaveClass('max-h-20', 'overflow-hidden')
    expect(showMore.parentElement).toHaveClass('bg-gradient-to-t')

    await user.click(showMore)

    expect(details).toHaveClass('max-h-64', 'overflow-auto')
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument()
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

    const details = await screen.findByText('Connection terminated')
    const firstAction = screen.getByRole('link', { name: /View guide/ })

    expect(details.compareDocumentPosition(firstAction)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})

describe('ErrorDisplay recovery actions', () => {
  it('exposes the first action and puts the rest in an overflow menu', async () => {
    const user = userEvent.setup()
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" actions={actions} />)

    const primary = screen.getByRole('link', { name: 'View guide' })
    const menuTrigger = screen.getByRole('button', { name: 'More troubleshooting options' })

    expect(primary).toBeInTheDocument()
    expect(primary).toHaveClass('rounded-r-none')
    expect(menuTrigger).toHaveClass('rounded-l-none', '-ml-px')
    expect(screen.queryByText('Restart project')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'More troubleshooting options' }))

    expect(screen.getByRole('menuitem', { name: /Restart project/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Contact support' })).toBeInTheDocument()
  })

  it('exposes retry and moves every other action into the overflow menu', async () => {
    const user = userEvent.setup()
    mockContainerWidth(640)
    render(<ErrorDisplay title="Failed to retrieve tables" actions={actions} onRetry={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View guide' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'More troubleshooting options' }))

    expect(screen.getByRole('menuitem', { name: 'View guide' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Restart project/ })).toBeInTheDocument()
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

const renderStep: ErrorDisplayStep = {
  id: 'ai',
  title: 'Debug with AI',
  action: {
    label: 'Debug with AI',
    render: ({ block }) => <div data-block={String(!!block)}>custom control</div>,
  },
}

describe('ErrorDisplay step actions', () => {
  it.each([
    ['full', 640, 'false'],
    ['compact', 260, 'true'],
  ] as const)(
    'renders a custom control through the render escape hatch in the %s layout',
    async (_layout, width, block) => {
      mockContainerWidth(width)
      render(<ErrorDisplay title="Failed to retrieve tables" steps={[renderStep]} />)

      const control = await screen.findByText('custom control')
      expect(control).toHaveAttribute('data-block', block)
    }
  )

  it('fires onStepOpenChange as steps expand and collapse', async () => {
    const user = userEvent.setup()
    const onStepOpenChange = vi.fn()
    mockContainerWidth(640)

    render(
      <ErrorDisplay
        title="Failed to retrieve tables"
        steps={steps}
        onStepOpenChange={onStepOpenChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /Restart your project/ }))
    expect(onStepOpenChange).toHaveBeenLastCalledWith('restart')

    await user.click(screen.getByRole('button', { name: /Restart your project/ }))
    expect(onStepOpenChange).toHaveBeenLastCalledWith(null)
  })

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

  it('keeps a labelled retry button in the compact layout', async () => {
    mockContainerWidth(260)
    render(<ErrorDisplay title="Failed to retrieve tables" onRetry={vi.fn()} />)

    const button = await screen.findByRole('button', { name: 'Try again' })
    expect(button).toHaveTextContent('Try again')
  })
})

describe('ErrorDisplay support action', () => {
  it.each([
    ['full', 640],
    ['compact', 260],
  ] as const)(
    'renders contact support directly when it is the only action in the %s layout',
    (_layout, width) => {
      mockContainerWidth(width)
      render(<ErrorDisplay title="Failed to retrieve tables" />)

      expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'More troubleshooting options' })
      ).not.toBeInTheDocument()
    }
  )
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
