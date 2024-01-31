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
        <ConnectTabTrigger value="App.tsx" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local" location=".env.local">
        <SimpleCodeBlock className="bash">
          {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="supabase.ts" location="utils/supabase.ts">
        <SimpleCodeBlock className="bash">
          {`
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="App.tsx" location="src/App.jsx">
        <SimpleCodeBlock className="typescript">
          {`
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
`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
