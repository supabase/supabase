import { MultipleCodeBlock } from 'ui-patterns/multiple-code-block'

import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: [
        `REACT_APP_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
        projectKeys?.publishableKey
          ? `REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${projectKeys.publishableKey}`
          : `REACT_APP_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}`,
        '',
      ].join('\n'),
    },
    {
      name: 'utils/supabase.ts',
      language: 'ts',
      code: `
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.${projectKeys.publishableKey ? 'REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'REACT_APP_SUPABASE_ANON_KEY'};

export const supabase = createClient(supabaseUrl, supabaseKey);
        `,
    },
    {
      name: 'App.tsx',
      language: 'tsx',
      code: `
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

function Page() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
    function getTodos() {
      const { data: todos } = await supabase.from('todos').select()

      if (todos.length > 1) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [])

  return (
    <div>
      {todos.map((todo) => (
        <li key={todo}>{todo}</li>
      ))}
    </div>
  )
}
export default Page
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
