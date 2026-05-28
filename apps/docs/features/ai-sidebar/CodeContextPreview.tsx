'use client'

import { ShikiCodeBlock } from './ShikiCodeBlock'

function CodeContextPreview({
  content,
  language,
}: {
  content: string
  language: string
}) {
  return (
    <ShikiCodeBlock
      content={content}
      language={language}
      hideCopy
      className="max-h-32 rounded-md text-xs"
    />
  )
}

export { CodeContextPreview }
