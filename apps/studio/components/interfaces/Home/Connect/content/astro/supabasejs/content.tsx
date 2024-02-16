import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="src/utils/supabase.ts" />
        <ConnectTabTrigger value="src/pages/index.astro" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="src/utils/supabase.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="src/pages/index.astro">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
---
import Layout from "../layouts/Layout.astro";
import { supabase } from "/src/supabase";

const { data: todos, error } = await supabase
  .from("todos")
  .select();

if (error) {
  console.error(error);
  throw error;
}

---

<Layout title="Hello world!">
  {todos ? (
    <ul>
      {todos.map(todo => <li>{todo.name}</li>)}
    </ul>
  ) : (
    <p>Nothing to do!</p>
  )}
</Layout>

`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
