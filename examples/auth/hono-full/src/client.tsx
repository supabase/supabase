import { createBrowserClient } from '@supabase/ssr';
import { hc } from 'hono/client';
import { useEffect, useState } from 'hono/jsx';
import { render } from 'hono/jsx/dom';
import type { AppType } from '.';

const client = hc<AppType>('/');

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

function App() {
  const [user, setUser] = useState<null | { id: string }>(null);
  // Check client-side if user is logged in:
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else {
        setUser(session?.user!);
      }
    });
  }, []);

  return (
    <>
      <h1>Hono Supabase Auth Example!</h1>
      <h2>Sign in</h2>
      {!user ? (
        <SignIn />
      ) : (
        <button
          type="button"
          onClick={() => {
            window.location.href = '/signout';
          }}
        >
          Sign out!
        </button>
      )}
      <h2>Example of API fetch()</h2>
      <UserDetailsButton />
      <h2>Example of database read</h2>
      <p>
        Note that only authenticated users are able to read from the database!
      </p>
      <a href="/countries">Get countries</a>
    </>
  );
}

function SignIn() {
  return (
    <>
      <p>
        Ready about and enable{' '}
        <a
          href="https://supabase.com/docs/guides/auth/auth-anonymous"
          target="_blank"
        >
          anonymous signins here!
        </a>
      </p>
      <button
        type="button"
        onClick={async () => {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) return console.error('Error signing in:', error.message);
          console.log('Signed in client-side!');
          alert('Signed in anonymously! User id: ' + data?.user?.id);
        }}
      >
        Anonymous sign in
      </button>
    </>
  );
}

const UserDetailsButton = () => {
  const [response, setResponse] = useState<string | null>(null);

  const handleClick = async () => {
    const response = await client.api.user.$get();
    const data = await response.json();
    const headers = Array.from(response.headers.entries()).reduce<
      Record<string, string>
    >((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
    const fullResponse = {
      url: response.url,
      status: response.status,
      headers,
      body: data,
    };
    setResponse(JSON.stringify(fullResponse, null, 2));
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        Get My User Details
      </button>
      {response && <pre>{response}</pre>}
    </div>
  );
};

const root = document.getElementById('root')!;
render(<App />, root);
