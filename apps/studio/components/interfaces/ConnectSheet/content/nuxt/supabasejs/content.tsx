import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

import { MultipleCodeBlock } from 'ui-patterns/multiple-code-block'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: `
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_KEY=${projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'}
        `,
    },
    {
      name: 'utils/supabase.ts',
      language: 'ts',
      code: `
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
        `,
    },
    {
      name: 'src/App.vue',
      language: 'jsx',
      code: `
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
`,
    },
  ]

  return (
    <MultipleCodeBlock files={files} />
  )
}

export default ContentFile
