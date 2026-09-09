import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from './tabs'

const renderTabs = ({ indicator = false } = {}) =>
  render(
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        {indicator ? <TabsIndicator /> : null}
      </TabsList>
      <TabsContent value="one">First</TabsContent>
      <TabsContent value="two">Second</TabsContent>
    </Tabs>
  )

describe('Tabs', () => {
  it('borders each trigger when no indicator is rendered', () => {
    const { container } = renderTabs()

    expect(screen.getByRole('tab', { name: 'One' })).toHaveClass('border-b-2')
    expect(container.querySelector('[data-tab-indicator]')).toBeNull()
  })

  it('measures the active tab only for lists that render an indicator', async () => {
    const withoutIndicator = renderTabs().container.querySelector<HTMLElement>('[role="tablist"]')
    const withIndicator = renderTabs({ indicator: true }).container.querySelector<HTMLElement>(
      '[role="tablist"]'
    )

    await waitFor(() => expect(withIndicator?.dataset.tabIndicatorReady).toBe(''))
    expect(withoutIndicator?.dataset.tabIndicatorReady).toBeUndefined()
  })

  it('hides the underline when no trigger is active', async () => {
    const { container, rerender } = render(
      <Tabs value="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="one">First</TabsContent>
      </Tabs>
    )
    const list = container.querySelector<HTMLElement>('[role="tablist"]')
    await waitFor(() => expect(list?.dataset.tabIndicatorReady).toBe(''))

    rerender(
      <Tabs value="gone">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="one">First</TabsContent>
      </Tabs>
    )

    await waitFor(() => expect(list?.dataset.tabIndicatorReady).toBeUndefined())
  })

  it('renders the first trigger as the first element in the list', () => {
    const { container } = renderTabs({ indicator: true })

    expect(container.querySelector('[role="tablist"]')?.firstElementChild).toBe(
      screen.getByRole('tab', { name: 'One' })
    )
  })

  it('passes a caller ref through to the list element', () => {
    const ref = { current: null as HTMLDivElement | null }

    render(
      <Tabs defaultValue="one">
        <TabsList ref={ref}>
          <TabsTrigger value="one">One</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
      </Tabs>
    )

    expect(ref.current).toBe(screen.getByRole('tablist'))
  })
})
