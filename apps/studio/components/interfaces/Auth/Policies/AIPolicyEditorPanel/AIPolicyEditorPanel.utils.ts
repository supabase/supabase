import { uuidv4 } from 'lib/helpers'
import { ThreadMessage } from 'openai/resources/beta/threads/messages/messages'

export const generateThreadMessage = ({
  id,
  threadId,
  runId,
  content,
  metadata = {},
}: {
  id?: string
  threadId?: string
  runId?: string
  content: string
  metadata?: any
}) => {
  const message: ThreadMessage = {
    id: id ?? uuidv4(),
    object: 'thread.message',
    role: 'assistant',
    file_ids: [],
    metadata,
    content: [
      {
        type: 'text',
        text: { value: content, annotations: [] },
      },
    ],
    created_at: Math.floor(Number(new Date()) / 1000),
    assistant_id: null,
    thread_id: threadId ?? '',
    run_id: runId ?? '',
  }
  return message
}
