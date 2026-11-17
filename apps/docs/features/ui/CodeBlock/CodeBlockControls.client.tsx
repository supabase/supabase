'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { CodeBlockControls } from 'ui-patterns/CodeBlock/CodeBlockControls'

interface TrackedCodeBlockControlsProps {
  content: string
  lang?: string
  copyId?: string
}

// the code block renders on the server, so this client part sends the copy event
export const TrackedCodeBlockControls = ({
  content,
  lang,
  copyId,
}: TrackedCodeBlockControlsProps) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const handleCopied = () =>
    sendTelemetryEvent({
      action: 'docs_code_copied',
      properties: { ...(lang ? { lang } : {}), ...(copyId ? { copyId } : {}) },
    })

  return <CodeBlockControls content={content} onCopied={handleCopied} />
}
