import { fireEvent, render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { MCP_CLIENT_GROUPS } from './clients.data'
import { MCP_CLIENTS } from './mcpClients'
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

describe('MCP client key lookup parity', () => {
  it('renders every client across groups (map preserves find behavior)', () => {
    render(<McpConfigPanel {...props} />, {
      wrapper: TooltipProvider,
    })
    // open the client dropdown: the trigger button shows the selected client label
    // (popover content renders in a portal, so query the document via screen)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(MCP_CLIENTS[0].label) }))
    for (const group of MCP_CLIENT_GROUPS) {
      expect(screen.getByText(group.heading)).toBeTruthy()
    }
    const labels = MCP_CLIENTS.map((c) => c.label)
    expect(new Set(labels).size).toBe(MCP_CLIENTS.length)
    for (const label of labels) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('switches selected client on known key', () => {
    const onClientSelect = vi.fn()
    render(<McpConfigPanel {...props} onClientSelect={onClientSelect} />, {
      wrapper: TooltipProvider,
    })
    fireEvent.click(screen.getByRole('button', { name: new RegExp(MCP_CLIENTS[0].label) }))
    fireEvent.click(screen.getByText(MCP_CLIENTS[1].label))
    expect(onClientSelect).toHaveBeenLastCalledWith(MCP_CLIENTS[1])
  })

  it('ignores unknown client key (no crash, selection unchanged)', () => {
    const onClientSelect = vi.fn()
    render(<McpConfigPanel {...props} onClientSelect={onClientSelect} />, {
      wrapper: TooltipProvider,
    })
    fireEvent.click(screen.getByRole('button', { name: new RegExp(MCP_CLIENTS[0].label) }))
    // search text matching nothing: exercises the `if (client)` guard path —
    // before fix .find returns undefined → ignored; after fix .get returns undefined → ignored
    const search = screen.getByPlaceholderText('Search...')
    fireEvent.change(search, { target: { value: 'no-such-client-xyz' } })
    expect(screen.getByText('No results found.')).toBeTruthy()
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onClientSelect).toHaveBeenLastCalledWith(MCP_CLIENTS[0])
  })
})
