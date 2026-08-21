import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MessagePartSwitcher } from './Message.Parts'

type MessagePart = Parameters<typeof MessagePartSwitcher>[0]['part']

describe('MessagePartSwitcher', () => {
  it('keeps consecutive generic tool parts as direct siblings', () => {
    const reasoningPart = {
      type: 'reasoning',
      state: 'done',
      text: 'I will look up the project details.',
    } as unknown as MessagePart
    const toolPart = {
      type: 'tool-load_knowledge',
      toolCallId: 'load-knowledge-1',
      state: 'output-available',
      input: {},
      output: {},
    } as unknown as MessagePart

    const { container } = render(
      <>
        <MessagePartSwitcher part={reasoningPart} />
        <MessagePartSwitcher part={toolPart} />
      </>
    )

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    expect(toolRows[0].nextElementSibling).toBe(toolRows[1])
    expect(toolRows[0]).toHaveClass('max-w-3xl')
  })
})
