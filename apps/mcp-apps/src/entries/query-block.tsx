import { CodeSquareIcon } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { ConversationPanel } from '../shell/ConversationPanel'
import { mountSurface } from './mount'

mountSurface('query-block', ({ initial }) =>
  initial.panel?.view === 'query' ? (
    <ConversationPanel initial={initial} />
  ) : (
    <EmptyStatePresentational
      icon={CodeSquareIcon}
      title="No query results"
      description="Ask the agent to show a query block."
    />
  )
)
