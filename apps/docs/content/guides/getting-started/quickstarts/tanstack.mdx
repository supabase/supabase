---
title: 'Use Supabase with TanStack Start'
subtitle: 'Learn how to create a Supabase project, add some sample data to your database, and query the data from a TanStack Start app.'
breadcrumb: 'Framework Quickstarts'
hideToc: true
---

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>

    <$Partial path="quickstart_db_setup.mdx" />

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={2}>

    <StepHikeCompact.Details title="Create a TanStack Start app">

    - Create a TanStack Start app using the official CLI.

    <$Partial path="uiLibCta.mdx" />

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      npm create @tanstack/start@latest my-app -- --package-manager npm --toolchain biome
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Install the Supabase client library">

    The fastest way to get started is to use the `supabase-js` client library which provides a convenient interface for working with Supabase from a TanStack Start app.

    Navigate to the TanStack Start app and install `supabase-js`.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      cd my-app && npm install @supabase/supabase-js
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={4}>
    <StepHikeCompact.Details title="Declare Supabase Environment Variables">

    Create a `.env` file in the root of your project and populate with your Supabase connection variables:

    <ProjectConfigVariables variable="url" />
    <ProjectConfigVariables variable="publishable" />
    <ProjectConfigVariables variable="anon" />

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      <$CodeTabs>

        ```text name=.env
        VITE_SUPABASE_URL=<SUBSTITUTE_SUPABASE_URL>
        VITE_SUPABASE_PUBLISHABLE_KEY=<SUBSTITUTE_SUPABASE_PUBLISHABLE_KEY>
        ```

      </$CodeTabs>

      <$Partial path="api_settings_steps.mdx" variables={{ "framework": "", "tab": "" }} />

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={5}>
    <StepHikeCompact.Details title="Create a Supabase client utility">

    Create a new file at `src/utils/supabase.ts` to initialize the Supabase client.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```ts name=src/utils/supabase.ts
      import { createClient } from "@supabase/supabase-js";

      export const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={6}>
    <StepHikeCompact.Details title="Query data from the app">

    Replace the contents of `src/routes/index.tsx` with the following code to add a loader function that fetches the instruments data and displays it on the page.

    </StepHikeCompact.Details>
    <StepHikeCompact.Code>

      ```tsx name=src/routes/index.tsx
      import { createFileRoute } from '@tanstack/react-router'
      import { supabase } from '../utils/supabase'

      export const Route = createFileRoute('/')({
        loader: async () => {
          const { data: instruments } = await supabase.from('instruments').select()
          return { instruments }
        },
        component: Home,
      })

      function Home() {
        const { instruments } = Route.useLoaderData()

        return (
          <ul>
            {instruments?.map((instrument) => (
              <li key={instrument.name}>{instrument.name}</li>
            ))}
          </ul>
        )
      }
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={7}>
    <StepHikeCompact.Details title="Start the app">

    Run the development server, go to http://localhost:3000 in a browser and you should see the list of instruments.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      npm run dev
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

## Next steps

- Set up [Auth](/docs/guides/auth) for your app
- [Insert more data](/docs/guides/database/import-data) into your database
- Upload and serve static files using [Storage](/docs/guides/storage)
