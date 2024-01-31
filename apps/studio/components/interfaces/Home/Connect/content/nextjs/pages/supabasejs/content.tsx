import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import { ConnectTabContent } from 'components/interfaces/Home/Connect/ConnectFilesContent'
import {
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="_app.tsx" />
        <ConnectTabTrigger value="supabase.ts" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local" location=".env.local">
        <SimpleCodeBlock className="bash">
          {`
NEXT_PUBLIC_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="supabase.ts" location="utils/supabase.ts">
        <SimpleCodeBlock className="bash">
          {`
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="_app.tsx" location="_app.tsx">
        <SimpleCodeBlock className="typescript">
          {`
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

`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
