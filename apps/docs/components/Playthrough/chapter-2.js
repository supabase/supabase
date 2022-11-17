import { Code, Playground, GoToFile } from './Playground'

const envContents = `NEXT_PUBLIC_SUPABASE_URL=https://fwobemhztvkziokpwsfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b2JlbWh6dHZremlva3B3c2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjY3MzUzNjUsImV4cCI6MTk4MjMxMTM2NX0.8OmPbKgfLNzrvZjpAf7SZRBH4tum5hHd1nOIPlTynlU`

export default {
  title: 'Step 2: Building the App',
  content: [
    <>
      <p>Lets start building the Next.js app from scratch.</p>
      <h3>Initialize a Next.js app</h3>
      <p>We can use create-next-app to initialize an app called supabase-nextjs</p>
    </>,
    {
      type: 'step',
      header: 'Initialize the app with create-next-app',
      solution: [{ command: 'npx create-next-app --use-npm --no-eslint --js .' }],
      show: () => <Playground />,
      children: (
        <>
          <p>Run:</p>
          <Code language="bash">npx create-next-app --use-npm --no-eslint --js .</Code>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed condimentum, nisl ut
            aliquam lacinia, nunc nisl aliquet nisl.
          </p>
        </>
      ),
    },
    <p>
      Now we need to add a dependency. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
      condimentum, nisl ut aliquam lacinia, nunc nisl aliquet nisl.
    </p>,
    {
      type: 'step',
      header: 'Install the Supabase client library',
      solution: [{ command: 'npm install @supabase/supabase-js' }],
      show: () => <Playground />,
      children: (
        <>
          <p>Run:</p>
          <Code language="bash">npm install @supabase/supabase-js</Code>
          <p>supabase-js is an isomorphic JavaScript client for Supabase</p>
        </>
      ),
    },
    {
      type: 'step',
      header: 'Add environment variables',
      intro: [
        {
          path: '.env.local',
          contents: `NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY`,
        },
      ],
      solution: [{ path: '.env.local', contents: envContents }],
      show: () => <Playground />,
      children: (
        <>
          <p>
            Go to <GoToFile path="/.env.local" /> and put your API keys
          </p>
          <Code language="py">{envContents}</Code>
        </>
      ),
    },
  ],
}
