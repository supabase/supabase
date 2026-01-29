import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

import { SimpleCodeBlock } from 'ui'
import {
  MultipleCodeBlock,
  MultipleCodeBlockContent,
  MultipleCodeBlockTrigger,
  MultipleCodeBlockTriggers,
} from 'ui-patterns/multiple-code-block'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <MultipleCodeBlock>
      <MultipleCodeBlockTriggers>
        <MultipleCodeBlockTrigger value=".env" />
        <MultipleCodeBlockTrigger value="src/utils/supabase.ts" />
        <MultipleCodeBlockTrigger value="src/routes/index.tsx" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value=".env">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
VITE_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
VITE_SUPABASE_KEY=${projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="src/utils/supabase.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="src/routes/index.tsx">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../utils/supabase'

export const Route = createFileRoute('/')({
  loader: async () => {
    const { data: todos } = await supabase.from('todos').select()
    return { todos }
  },
  component: Home,
})

function Home() {
  const { todos } = Route.useLoaderData()

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}
`}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile
