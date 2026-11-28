import { render, screen } from '@testing-library/react'
import { Profiler } from 'react'
import { TooltipProvider } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { Suggestion } from './ColumnEditor.types'
import InputWithSuggestions from './InputWithSuggestions'

describe('InputWithSuggestions', () => {
  it('does not enter a render loop when suggestions is omitted at runtime', () => {
    const onRender = vi.fn()

    render(
      <TooltipProvider>
        <Profiler id="input-with-suggestions" onRender={onRender}>
          <InputWithSuggestions
            aria-label="Default Value"
            value=""
            suggestions={undefined as unknown as Suggestion[]}
            onChange={vi.fn()}
            onSelectSuggestion={vi.fn()}
          />
        </Profiler>
      </TooltipProvider>
    )

    expect(screen.getByLabelText('Default Value')).toBeInTheDocument()
    expect(onRender.mock.calls.length).toBeLessThan(5)
  })
})
