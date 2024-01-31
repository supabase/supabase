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
        <ConnectTabTrigger value="supabase.ts" />
        <ConnectTabTrigger value="App.vue" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local" location=".env.local">
        <SimpleCodeBlock className="bash">
          {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="supabase.ts" location="utils/supabase.ts">
        <SimpleCodeBlock className="bash">
          {`
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="App.vue" location="src/App.vue">
        <SimpleCodeBlock className="typescript">
          {`
<script setup>
  import { supabase } from '../utils/supabase'
  const todos = ref([])

  async function getTodos() {
    const { data: todos } = await supabase.from('todos').select()
    countries.value = todos
  }

  onMounted(() => {
    getTodos()
  })

</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">{{ todo.name }}</li>
  </ul>
</template>
`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
