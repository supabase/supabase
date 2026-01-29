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
        <MultipleCodeBlockTrigger value=".env" />
        <MultipleCodeBlockTrigger value="app/utils/supabase.server.ts" />
        <MultipleCodeBlockTrigger value="app/routes/_index.tsx" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value=".env">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {[
            '',
            `VITE_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
            projectKeys?.publishableKey
              ? `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${projectKeys.publishableKey}`
              : `VITE_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}`,
            '',
          ].join('\n')}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="app/utils/supabase.server.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

export function createClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_${projectKeys.publishableKey ? 'SUPABASE_PUBLISHABLE_DEFAULT_KEY' : 'SUPABASE_ANON_KEY'};,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "") as {
            name: string;
            value: string;
          }[];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );

  return { supabase, headers };
}
`}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="app/routes/_index.tsx">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
import type { Route } from "./+types/home";
import { createClient } from "~/utils/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { data: todos } = await supabase.from("todos").select();

  return { todos };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <ul>
        {loaderData.todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </>
  );
}

`}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile
