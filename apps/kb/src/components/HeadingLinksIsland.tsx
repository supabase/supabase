import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CopyHeadingLinkButton, TooltipProvider } from 'ui'

// markdown gives static html, so one react tree puts a button into each heading with a portal
export const HeadingLinksIsland = () => {
  // client:only island: the browser parses the article dom before this first render
  const [headings] = useState(() => [
    ...document.querySelectorAll<HTMLHeadingElement>('article.prose > :is(h2, h3, h4)[id]'),
  ])

  return (
    <TooltipProvider>
      {headings.map((heading) =>
        createPortal(
          <CopyHeadingLinkButton id={heading.id} className="ml-2 align-middle" />,
          heading,
          heading.id
        )
      )}
    </TooltipProvider>
  )
}
