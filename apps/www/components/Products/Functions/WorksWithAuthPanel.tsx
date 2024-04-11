import React from 'react'
import CodeWindow from '~/components/CodeWindow'

const code = `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Create supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: {
        headers: {
          Authorization: req.headers.get('Authorization')!}
        }
    }
  )

  // Get the session or user object
  const { data } = await supabase.auth.getUser()
  const user = data.user
})`

const WorksWithAuthPanel = () => <CodeWindow code={code} showLineNumbers />

export default WorksWithAuthPanel
