import type { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTrigger,
  ConnectTabTriggers,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value=".env.local" />
        <ConnectTabTrigger value="page.tsx" />
        <ConnectTabTrigger value="utils/supabase/server.ts" />
        <ConnectTabTrigger value="utils/supabase/client.ts" />
        <ConnectTabTrigger value="utils/supabase/middleware.ts" />
      </ConnectTabTriggers>

      <ConnectTabContent value=".env.local">
        <SimpleCodeBlock className="bash" parentClassName="min-h-72">
          {`
NEXT_PUBLIC_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${projectKeys.anonKey ?? 'your-anon-key'}
            `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="page.tsx">
        <SimpleCodeBlock className="tsx" parentClassName="min-h-72">
          {`
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul>
      {todos?.map((todo) => (
        <li>{todo}</li>
      ))}
    </ul>
  )
}
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="utils/supabase/server.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The \`setAll\` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
`}
        </SimpleCodeBlock>
      </ConnectTabContent>
      <ConnectTabContent value="utils/supabase/client.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="utils/supabase/middleware.ts">
        <SimpleCodeBlock className="ts" parentClassName="min-h-72">
          {`
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return supabaseResponse
};

`}
        </SimpleCodeBlock>
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
