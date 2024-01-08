import { format } from 'sql-formatter'

import { getThread } from './MessageId.utils'

import { parseTables } from '@/lib/utils'
import SchemaFlowHandler from './SchemaFlowHandler'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

import { cookies } from 'next/headers'

interface SchemaFlowProps {
  code: string
}
export async function SchemaFlow({ code }: SchemaFlowProps) {
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  return <SchemaFlowHandler content={strippedCode} />
}
