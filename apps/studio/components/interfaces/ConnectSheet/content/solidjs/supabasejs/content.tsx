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
      name: 'src/App.tsx',
      language: 'tsx',
      code: `
import { supabase } from '../utils/supabase'
import { createResource, For } from "solid-js";

async function getTodos() {
  const { data: todos } = await supabase.from("todos").select();
  return todos;
}

function App() {
  const [todos] = createResource(getTodos);

  return (
    <ul>
      <For each={todos()}>{(todo) => <li>{todo.name}</li>}</For>
    </ul>
  );
}

export default App;
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
