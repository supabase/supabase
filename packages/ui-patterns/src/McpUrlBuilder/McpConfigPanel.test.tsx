import { fireEvent, render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { describe, expect, it } from 'vitest'

import { McpConfigPanel } from './McpConfigPanel'

const props = {
  isPlatform: true,
  platformUrl: 'https://mcp.supabase.com/mcp',
  nonPlatformUrl: 'http://localhost:54321/mcp',
  onCopyCallback: () => {},
}

function selectOptOut(tool: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }))
  fireEvent.click(screen.getByRole('combobox', { name: 'Skip confirmations for' }))
  fireEvent.click(screen.getByRole('option', { name: tool }))
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Skip confirmations for' }), {
    key: 'Escape',
  })
}

describe('McpConfigPanel default feature groups', () => {
  it('enables feedback by default only for hosted connections', () => {
    const { container, rerender } = render(<McpConfigPanel {...props} />, {
      wrapper: TooltipProvider,
    })
    expect(container.textContent).toMatch(/features=[^&\s"]*feedback/)
    expect(container.textContent).not.toMatch(/features=[^&\s"]*storage/)

    // Older local Studio versions reject unknown groups with a 400.
    rerender(<McpConfigPanel {...props} isPlatform={false} />)
    expect(container.textContent).toContain('features=docs')
    expect(container.textContent).not.toMatch(/features=[^&\s"]*feedback/)
  })

  it('keeps notebooks opt-in and hosted-only', () => {
    const { container, rerender } = render(<McpConfigPanel {...props} />, {
      wrapper: TooltipProvider,
    })
    expect(container.textContent).not.toMatch(/features=[^&\s"]*notebooks/)

    rerender(<McpConfigPanel {...props} isPlatform={false} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select features' }))
    expect(screen.queryByRole('option', { name: /^Notebooks/ })).toBeNull()
  })
})

describe('McpConfigPanel notebook opt-outs', () => {
  it('offers notebook skips only while the notebooks group is enabled', () => {
    const { container } = render(<McpConfigPanel {...props} />, { wrapper: TooltipProvider })
    const featuresCombobox = screen.getByRole('combobox', { name: 'Select features' })
    fireEvent.click(featuresCombobox)
    fireEvent.click(screen.getByRole('option', { name: /^Notebooks/ }))
    fireEvent.keyDown(featuresCombobox, { key: 'Escape' })
    expect(container.textContent).toMatch(/features=[^&\s"]*notebooks/)

    selectOptOut('delete_notebook')
    expect(container.textContent).toContain('skip_elicitations=delete_notebook')

    fireEvent.click(featuresCombobox)
    fireEvent.click(screen.getByRole('option', { name: /^Notebooks/ }))
    expect(container.textContent).not.toContain('skip_elicitations=')
  })
})

describe('McpConfigPanel opt-out transitions', () => {
  it('permanently clears cost opt-outs when a connection becomes project scoped', () => {
    const { container, rerender } = render(<McpConfigPanel {...props} />, {
      wrapper: TooltipProvider,
    })
    selectOptOut('create_branch')
    expect(container.textContent).toContain('skip_elicitations=create_branch')

    rerender(<McpConfigPanel {...props} projectRef="test-project" />)
    expect(container.textContent).not.toContain('skip_elicitations=')

    rerender(<McpConfigPanel {...props} />)
    expect(container.textContent).not.toContain('skip_elicitations=')
  })

  it('permanently clears SQL opt-outs across a non-platform connection', () => {
    const { container, rerender } = render(<McpConfigPanel {...props} />, {
      wrapper: TooltipProvider,
    })
    selectOptOut('execute_sql')
    expect(container.textContent).toContain('skip_elicitations=execute_sql')

    rerender(<McpConfigPanel {...props} isPlatform={false} />)
    expect(container.textContent).not.toContain('skip_elicitations=')

    rerender(<McpConfigPanel {...props} />)
    expect(container.textContent).not.toContain('skip_elicitations=')
  })

  it('does not restore SQL opt-outs after read-only mode is turned off', () => {
    const { container } = render(<McpConfigPanel {...props} />, { wrapper: TooltipProvider })
    selectOptOut('execute_sql')
    expect(container.textContent).toContain('skip_elicitations=execute_sql')

    fireEvent.click(screen.getByRole('switch', { name: 'Read-only' }))
    expect(container.textContent).not.toContain('skip_elicitations=')

    fireEvent.click(screen.getByRole('switch', { name: 'Read-only' }))
    expect(container.textContent).not.toContain('skip_elicitations=')
  })

  it.each([
    { feature: 'Database', tool: 'execute_sql' },
    { feature: 'Account', tool: 'create_branch' },
    { feature: 'Branching', tool: 'create_branch' },
  ])('does not restore $tool after removing and readding $feature', ({ feature, tool }) => {
    const { container } = render(<McpConfigPanel {...props} />, { wrapper: TooltipProvider })
    selectOptOut(tool)
    expect(container.textContent).toContain(`skip_elicitations=${tool}`)

    fireEvent.click(screen.getByRole('combobox', { name: 'Select features' }))
    fireEvent.click(screen.getByRole('option', { name: new RegExp(`^${feature}`) }))
    expect(container.textContent).not.toContain('skip_elicitations=')

    fireEvent.click(screen.getByRole('option', { name: new RegExp(`^${feature}`) }))
    expect(container.textContent).not.toContain('skip_elicitations=')
  })
})
