import type { ToolUIPart } from 'ai'
import { describe, expect, it } from 'vitest'

import { MessagePartSwitcher } from './Message.Parts'
import { customRender } from '@/tests/lib/custom-render'

type MessagePart = Parameters<typeof MessagePartSwitcher>[0]['part']

describe('MessagePartSwitcher', () => {
  it('keeps consecutive generic tool parts as direct siblings', () => {
    const reasoningPart = {
      type: 'reasoning',
      state: 'done',
      text: 'I will look up the project details.',
    } satisfies Extract<MessagePart, { type: 'reasoning' }>
    const toolPart = {
      type: 'tool-load_knowledge',
      toolCallId: 'load-knowledge-1',
      state: 'output-available',
      input: {},
      output: {},
    } satisfies ToolUIPart

    const { container } = customRender(
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
