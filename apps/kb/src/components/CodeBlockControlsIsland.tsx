import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TooltipProvider } from 'ui'
import { CodeBlockControls } from 'ui-patterns/CodeBlock/CodeBlockControls'

// markdown gives static html, so one react tree puts the controls into each frame with a portal
export function CodeBlockControlsIsland() {
  // client:only island: the browser parses the article dom before this first render.
  // src/lib/mdx/shiki-code-block.ts makes these frames and stores the copy text of each block
  const [frames] = useState(() => [...document.querySelectorAll<HTMLElement>('[data-code-source]')])

  return (
    <TooltipProvider>
      {frames.map((frame, idx) =>
        // the frame list is a fixed snapshot of static markup, so the index identifies each frame
        createPortal(
          <CodeBlockControls content={frame.dataset.codeSource ?? ''} />,
          frame,
          `${idx}`
        )
      )}
    </TooltipProvider>
  )
}
