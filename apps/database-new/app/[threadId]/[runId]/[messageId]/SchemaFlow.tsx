import { format } from 'sql-formatter'

import { getThread } from './MessageId.utils'

import { parseTables } from '@/lib/utils'
import SchemaFlowHandler from './SchemaFlowHandler'

export async function SchemaFlow({ params }: { params: any }) {
  const { threadId, runId, messageId } = params

  const content = await getThread({ threadId, runId, messageId })

  // const code = format(content, { language: 'postgresql' })

  const tables = await parseTables(content)

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  return <SchemaFlowHandler tables={tables} />
}
