import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MultipleCodeBlock } from './index'

describe('MultipleCodeBlock', () => {
  it('resets the active tab when the available files change in uncontrolled mode', () => {
    const { rerender } = render(
      <MultipleCodeBlock
        files={[
          {
            name: '.env.local',
            language: 'bash',
            code: 'NEXT_PUBLIC_SUPABASE_URL=https://next.example',
          },
        ]}
      />
    )

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('.env.local')
    expect(screen.getByText('NEXT_PUBLIC_SUPABASE_URL=https://next.example')).toBeVisible()

    rerender(
      <MultipleCodeBlock
        files={[
          {
            name: '.env',
            language: 'bash',
            code: 'VITE_SUPABASE_URL=https://react.example',
          },
        ]}
      />
    )

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('.env')
    expect(screen.getByText('VITE_SUPABASE_URL=https://react.example')).toBeVisible()
  })

  it('renders tab content with vertical auto-scrolling instead of forced overflow scrollbars', () => {
    const { container } = render(
      <MultipleCodeBlock
        files={[
          {
            name: 'page.tsx',
            language: 'tsx',
            code: 'export default function Page() { return null }',
          },
        ]}
      />
    )

    const tabContent = container.querySelector('[data-connect-tab-content]')
    expect(tabContent).toHaveClass('overflow-y-auto')
    expect(tabContent).not.toHaveClass('overflow-scroll')
  })

  it('stops propagation of Shift+wheel events on the tab list and code block', () => {
    const onParentWheel = vi.fn()
    const { container } = render(
      <div onWheel={onParentWheel}>
        <MultipleCodeBlock
          files={[
            {
              name: 'page.tsx',
              language: 'tsx',
              code: 'export default function Page() { return null }',
            },
          ]}
        />
      </div>
    )

    const tabList = screen.getByRole('tablist')
    const codeElement = container.querySelector('code')
    expect(codeElement).not.toBeNull()

    fireEvent.wheel(tabList, { deltaY: 100, shiftKey: true })
    fireEvent.wheel(codeElement!, { deltaY: 100, shiftKey: true })
    expect(onParentWheel).not.toHaveBeenCalled()

    fireEvent.wheel(tabList, { deltaY: 100, shiftKey: false })
    fireEvent.wheel(codeElement!, { deltaY: 100, shiftKey: false })
    expect(onParentWheel).toHaveBeenCalledTimes(2)
  })
})
