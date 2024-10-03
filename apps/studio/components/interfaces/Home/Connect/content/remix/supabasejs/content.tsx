import type { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTriggers,
  ConnectTabTrigger,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import { SimpleCodeBlock } from '@ui/components/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env" />
        <ConnectTabTrigger value="app/utils/supabase.server.ts" />
        <ConnectTabTrigger value="app/routes/_index.tsx" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="app/utils/supabase.server.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createServerClient, serialize, parse } from "@supabase/ssr";

export function createClient(request: Request) {
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    },
  );
}
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="app/routes/_index.tsx">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "~/utils/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: todos } = await supabase.from('todos').select()

  return { todos }
}

export default function Index() {
  const { todos } = useLoaderData<typeof loader>();
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}
`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
