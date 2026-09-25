import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import type { StickToBottomContext } from 'use-stick-to-bottom'
import { describe, expect, it } from 'vitest'

import { Conversation, ConversationContent } from './Conversation'

describe('ConversationContent', () => {
  it('keeps scroll viewport classes separate from content classes and DOM attributes', () => {
    const context = createRef<StickToBottomContext>()
    const { rerender } = render(
      <Conversation contextRef={context}>
        <ConversationContent scrollClassName="scroll-pt-4" className="space-y-4" id="messages">
          Message
        </ConversationContent>
      </Conversation>
    )

    const viewport = context.current?.scrollRef.current
    const content = context.current?.contentRef.current
    expect(viewport).toHaveClass('scroll-pt-4', 'overscroll-y-contain')
    expect(viewport).not.toHaveClass('space-y-4')
    expect(content).toHaveClass('space-y-4')
    expect(content).not.toHaveClass('scroll-pt-4')
    expect(content).toHaveAttribute('id', 'messages')
    expect(content).not.toHaveAttribute('scrollClassName')

    rerender(
      <Conversation contextRef={context}>
        <ConversationContent scrollClassName="scroll-pt-8" className="space-y-4" id="messages">
          {() => 'Updated message'}
        </ConversationContent>
      </Conversation>
    )

    expect(context.current?.scrollRef.current).toBe(viewport)
    expect(context.current?.contentRef.current).toBe(content)
    expect(viewport).toHaveClass('scroll-pt-8')
    expect(viewport).not.toHaveClass('scroll-pt-4')
    expect(screen.getByText('Updated message')).toBeInTheDocument()
  })
})
