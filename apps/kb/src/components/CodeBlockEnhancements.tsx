import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TooltipProvider } from 'ui'
import { CodeBlockControls } from 'ui-patterns/CodeBlock/CodeBlockControls'

// frames come from src/lib/mdx/shiki-code-block.ts, which stores each block's copy text
const findCodeBlocks = () => [...document.querySelectorAll<HTMLElement>('[data-code-source]')]

// markdown renders static html, so controls mount into each frame through one react tree
export const CodeBlockEnhancements = () => {
  // client:only island: the article dom is parsed before this first render
  const [frames] = useState(findCodeBlocks)

  return (
    <TooltipProvider>
      {frames.map((frame, idx) =>
        // a fixed snapshot of static markup, so position is each frame's identity
        createPortal(
          <CodeBlockControls content={frame.dataset.codeSource ?? ''} />,
          frame,
          `${idx}`
        )
      )}
    </TooltipProvider>
  )
}
