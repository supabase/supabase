import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, IconAlertTriangle } from 'ui'

interface serverProps {
  props: any
}
const server = () => {
  return (
    <div>
      <pre className="text-sm">
        {`
// /utils/supabase/server.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The \`set\` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The \`delete\` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
        `}
      </pre>
      <Alert_Shadcn_ variant="warning">
        <IconAlertTriangle strokeWidth={2} />
        <AlertTitle_Shadcn_>Beware</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>The Ides of March</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    </div>
  )
}

export default server
