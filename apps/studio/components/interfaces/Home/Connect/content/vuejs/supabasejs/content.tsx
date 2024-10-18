import type { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import { SimpleCodeBlock } from '@ui/components/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="utils/supabase.ts" />
        <ConnectTabTrigger value="App.vue" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="utils/supabase.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="App.vue">
        <SimpleCodeBlock className="jsx" parentClassName="min-h-72">
          {`
<script setup>
  import { supabase } from '../utils/supabase'
  const todos = ref([])

  async function getTodos() {
    const { data } = await supabase.from('todos').select()
    todos.value = data
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
