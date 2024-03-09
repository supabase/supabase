import Editor from '@monaco-editor/react'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

import { SQLEditorLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import toast from 'react-hot-toast'

function evalWithScope(js: string, contextAsScope: any) {
  return new Function(`with (this) { return (${js}); }`).call(contextAsScope)
}

const SupabaseJSEditor: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()

  const [value, setValue] = useState('')

  const { data: settings } = useProjectApiQuery({ projectRef })
  const apiService = settings?.autoApiService

  const apiUrl = `${apiService?.protocol ?? 'https'}://${apiService?.endpoint ?? '-'}`
  const anonKey = apiService?.defaultApiKey

  const [result, setResult] = useState<string | undefined>()
  console.log('result:', result)

  async function doit() {
    try {
      if (!apiUrl || !anonKey) throw new Error('No API URL or anon key')

      const supabase = createClient(apiUrl, anonKey)

      const result = await evalWithScope(value, { supabase })

      if (result.error !== null) {
        setResult(result.error.message)
        return
      }

      setResult(JSON.stringify(result.data, null, 2))
    } catch (error) {
      if (error instanceof Error) {
        setResult(error.message)
      } else {
        toast.error('An error occurred')
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <Editor onChange={(value) => setValue(value ?? '')} defaultLanguage="javascript" />
      <Button onClick={doit}>Run</Button>
    </div>
  )
}

SupabaseJSEditor.getLayout = (page) => (
  <SQLEditorLayout title="Supabase JS Editor">{page}</SQLEditorLayout>
)

export default SupabaseJSEditor
