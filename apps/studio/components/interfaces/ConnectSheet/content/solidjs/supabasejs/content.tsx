import { MultipleCodeBlock } from 'ui-patterns/multiple-code-block'

import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: [
        `SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
        projectKeys?.publishableKey
          ? `SUPABASE_PUBLISHABLE_DEFAULT_KEY=${projectKeys.publishableKey}`
          : `SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}`,
        '',
      ].join('\n'),
    },
    {
      name: 'utils/supabase.ts',
      language: 'ts',
      code: `
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.${projectKeys.publishableKey ? 'SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'SUPABASE_ANON_KEY'};

export const supabase = createClient(supabaseUrl!, supabaseKey!);
        `,
    },
    {
      name: 'src/App.jsx',
      language: 'jsx',
      code: `
import { supabase } from '../utils/supabase'
import { createResource, For } from "solid-js";

async function getTodos() {
  const { data: todos } = await supabase.from("todos").select();
  return data;
}

function App() {
  const [todos] = createResource(getTodos);

  return (
    <ul>
      <For each={todos()}>{(country) => <li>{todo.name}</li>}</For>
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
