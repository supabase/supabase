import { ClientCodeEditor } from './CodeEditor.client'
import { ThreadPageProps } from './[message_id]/page'
import { getMessage } from './getMessage'

export async function CodeEditor({ params }: ThreadPageProps) {
  const { message_id } = params
  const code = await getMessage(message_id)

  return <ClientCodeEditor code={code} />
}
