import '../styles/globals.css'
import { useState } from 'react';
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router';
import { createBrowserSupabaseClient, Session } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react"

function MyApp({ Component, pageProps }: AppProps<{
  initialSession: Session;
}>) {
  const router = useRouter();
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  supabaseClient.auth.onAuthStateChange((event, session) => {
    switch( event) 
    { case 'SIGNED_IN': 
        router.push('/');
        return;
      case 'SIGNED_OUT':
        router.push('/login');
        return;
    }
  })

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >

      
      

      <Component {...pageProps} />
    </SessionContextProvider>
  );
}

export default MyApp
