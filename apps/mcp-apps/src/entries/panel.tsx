import { PanelRightIcon } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { ConversationPanel } from '../shell/ConversationPanel'
import { mountSurface } from './mount'

mountSurface('panel', ({ initial }) =>
  initial.panel ? (
    <ConversationPanel initial={initial} />
  ) : (
    <div className="p-4">
      <EmptyStatePresentational
        icon={PanelRightIcon}
        title="Nothing to show"
        description="Ask the agent to open logs, SQL results or a row."
      />
    </div>
  )
)
