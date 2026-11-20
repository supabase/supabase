import { Markdown } from 'ui-patterns/Markdown'

import { ErrorCodes } from '@/components/error-codes'
import { remarkJsxComponents } from '@/lib/remark-jsx-components'

export default function MarkdownCustomization() {
  return (
    <Markdown
      remarkPlugins={[remarkJsxComponents]}
      components={{
        ErrorCodes,
      }}
    >
      {`## Auth error codes

<ErrorCodes service="auth" />
`}
    </Markdown>
  )
}
