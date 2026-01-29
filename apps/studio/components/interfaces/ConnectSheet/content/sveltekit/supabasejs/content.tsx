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
        <MultipleCodeBlockTrigger value=".env.local" />
        <MultipleCodeBlockTrigger value="src/lib/supabaseClient.js" />
        <MultipleCodeBlockTrigger value="src/routes/+page.server.js" />
        <MultipleCodeBlockTrigger value="src/routes/+page.svelte" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {[
            '',
            `PUBLIC_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
            projectKeys?.publishableKey
              ? `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${projectKeys.publishableKey}`
              : `PUBLIC_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}`,
            '',
          ].join('\n')}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="src/lib/supabaseClient.js">
        <SimpleCodeBlock className="js" parentClassName="min-h-72">
          {`
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, ${projectKeys.publishableKey ? 'PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'PUBLIC_SUPABASE_ANON_KEY'} } from "$env/static/public"

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = ${projectKeys.publishableKey ? 'PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'PUBLIC_SUPABASE_ANON_KEY'};

export const supabase = createClient(supabaseUrl, supabaseKey);
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="src/routes/+page.server.js">
        <SimpleCodeBlock className="js" parentClassName="min-h-72">
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
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="src/routes/+page.svelte">
        <SimpleCodeBlock className="html" parentClassName="min-h-72">
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
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile
