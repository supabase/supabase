import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: [
        `PUBLIC_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
        projectKeys?.publishableKey
          ? `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${projectKeys.publishableKey}`
          : `PUBLIC_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}`,
        '',
      ].join('\n'),
    },
    {
      name: 'src/lib/supabaseClient.js',
      language: 'js',
      code: `
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, ${projectKeys.publishableKey ? 'PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'PUBLIC_SUPABASE_ANON_KEY'} } from "$env/static/public"

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = ${projectKeys.publishableKey ? 'PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'PUBLIC_SUPABASE_ANON_KEY'};

export const supabase = createClient(supabaseUrl, supabaseKey);
        `,
    },
    {
      name: 'src/routes/+page.server.js',
      language: 'js',
      code: `
import { supabase } from "$lib/supabaseClient";

export async function load() {
  const { data } = await supabase.from("countries").select();
  return {
    countries: data ?? [],
  };
}
`,
    },
    {
      name: 'src/routes/+page.svelte',
      language: 'html',
      code: `
<script>
  export let data;
</script>

<ul>
  {#each data.countries as country}
    <li>{country.name}</li>
  {/each}
</ul>
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
