import { Code, Playground, GoToFile } from './Playground'

const appContents = `import '../styles/globals.css'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient({ cookieOptions: { sameSite: 'none' } }))

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  )
}
export default MyApp`

const indexContents1 = `import { Auth, ThemeSupa } from '@supabase/auth-ui-react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

const Home = () => {
  const session = useSession()
  const supabase = useSupabaseClient()

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {!session ? (
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
        />
      ) : (
        <p>Account page will go here.</p>
      )}
    </div>
  )
}

export default Home`

export default {
  title: 'Step 3: The Login component',
  content: [
    <>
      <p>Let's start building the Next.js app from scratch.</p>
      <h3>Initialize a Next.js app</h3>
      <p>We can use create-next-app to initialize an app called supabase-nextjs</p>
    </>,
    {
      type: 'step',
      header: 'Install auth helpers',
      solution: [
        {
          command: 'npm install @supabase/auth-helpers-react @supabase/auth-helpers-nextjs',
        },
      ],
      show: () => <Playground />,
      children: (
        <>
          <p>Run:</p>
          <Code language="bash">
            npm install @supabase/auth-helpers-react @supabase/auth-helpers-nextjs
          </Code>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed condimentum, nisl ut
            aliquam lacinia, nunc nisl aliquet nisl.
          </p>
        </>
      ),
    },
    {
      type: 'step',
      header: 'Add SessionContextProvider',
      intro: [{ currentPath: '/pages/_app.js' }],
      solution: [{ path: 'pages/_app.js', contents: appContents }],
      show: () => <Playground />,
      children: (
        <>
          Go to <GoToFile path="pages/_app.js" /> and add the context provider:
          <Code language="jsx">{appContents}</Code>
        </>
      ),
    },
    {
      type: 'step',
      header: 'Install Supabase Auth UI',
      solution: [{ command: 'npm install @supabase/auth-ui-react' }],
      show: () => <Playground />,
      children: (
        <>
          Install this:
          <Code language="bash">npm install @supabase/auth-ui-react</Code>
        </>
      ),
    },
    {
      type: 'step',
      header: 'Add the Auth component',
      solution: [{ path: 'pages/index.js', contents: indexContents1 }],
      show: () => <Playground />,
      children: (
        <>
          Now put this into <GoToFile path="pages/index.js" />:<Code>{indexContents1}</Code>
        </>
      ),
    },
    {
      type: 'step',
      header: 'Run the app',
      intro: [{ path: 'components/Account.js', contents: '' }],
      solution: [{ command: 'npm run dev', onRunning: true }],
      show: () => <Playground />,
      children: (
        <>
          You can run the app with:
          <Code language="bash">npm run dev</Code>
        </>
      ),
    },
  ],
}
