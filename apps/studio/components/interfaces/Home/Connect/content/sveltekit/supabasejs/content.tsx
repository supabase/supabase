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
        <ConnectTabTrigger value="supabaseClient.js" />
        <ConnectTabTrigger value="+page.server.js" />
        <ConnectTabTrigger value="+page.svelte" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local" location=".env.local">
        <SimpleCodeBlock className="bash">
          {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="supabaseClient.js" location="src/lib/supabaseClient.js">
        <SimpleCodeBlock className="bash">
          {`
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="+page.server.js" location="src/routes/+page.server.js">
        <SimpleCodeBlock className="typescript">
          {`
  import { supabase } from "$lib/supabaseClient";

  export async function load() {
    const { data } = await supabase.from("countries").select();
    return {
      countries: data ?? [],
    };
  }
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="+page.svelte" location="src/routes/+page.svelte">
        <SimpleCodeBlock className="typescript">
          {`
  <script>
    export let data;
  </script>

  <ul>
    {#each data.countries as country}
      <li>{country.name}</li>
    {/each}
  </ul>
`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
