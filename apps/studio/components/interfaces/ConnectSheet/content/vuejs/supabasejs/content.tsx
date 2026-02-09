import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: [
        `VITE_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
        projectKeys?.publishableKey
          ? `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${projectKeys.publishableKey}`
          : `VITE_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}`,
        '',
      ].join('\n'),
    },
    {
      name: 'utils/supabase.ts',
      language: 'ts',
      code: `
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.${projectKeys.publishableKey ? 'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'VITE_SUPABASE_ANON_KEY'};

export const supabase = createClient(supabaseUrl, supabaseKey);
        `,
    },
    {
      name: 'App.vue',
      language: 'html',
      code: `
<script setup>
  import { ref, onMounted } from 'vue'
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

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
