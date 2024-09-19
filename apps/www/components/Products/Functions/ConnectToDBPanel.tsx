import React from 'react'
import CodeWindow from '~/components/CodeWindow'

const code = `const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    global: {
      headers: {
        Authorization:
          req.headers.get('Authorization')!
      }
    }
  }
)

const { data, error } = await supabase
                                .from('countries')
                                .select('*')`

const ConnectToDBPanel = () => (
  <CodeWindow className="[&_.synthax-highlighter]:!min-h-[200px]" code={code} showLineNumbers />
)

export default ConnectToDBPanel
