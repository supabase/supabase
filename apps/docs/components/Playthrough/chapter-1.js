import { Browser } from './Browser'
import { nextStep } from './steps'

export default {
  title: 'Step 1: Project set up',
  content: [
    <>
      <p>
        Before we start building we&apos;re going to set up our Database and API. This is as simple
        as starting a new Project in Supabase and then creating a schema inside the database.
      </p>
      <h3>Create a project</h3>
    </>,
    {
      type: 'step',
      header: 'Log in',
      show: () => <Browser url="app.supabase.com" screen="login" onEvent={nextStep} />,
    },
    {
      type: 'step',
      header: 'Click on "New Project"',
      show: () => <Browser url="app.supabase.com" screen="new project" onEvent={nextStep} />,
    },
    {
      type: 'step',
      header: 'Enter your project details',
      show: () => <Browser url="app.supabase.com" screen="project details" onEvent={nextStep} />,
      children: (
        <>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed condimentum, nisl ut
            aliquam lacinia, nunc nisl aliquet nisl.
          </p>
          <p>
            Nec tincidunt nunc nisl eget nunc. Donec auctor, nisl eget aliquam tincidunt, nunc nisl
            aliquet nisl, nec tincidunt nunc nisl eget nunc.
          </p>
        </>
      ),
    },
    {
      type: 'step',
      header: 'Wait for the new database to launch',
      show: () => <Browser url="app.supabase.com" screen="launch database" onEvent={nextStep} />,
    },
    <>
      <h3>Set up the database schema </h3>
      <p>
        Now we are going to set up the database schema. We can use the User Management Starter
        quickstart in the SQL Editor, or you can just copy/paste the SQL from below and run it
        yourself.
      </p>
    </>,
    {
      type: 'step',
      header: 'Go to the SQL Editor',
      show: () => (
        <Browser
          url="https://app.supabase.com/project/fwobemhztvkziokpwsfc"
          screen="go to editor"
          onEvent={nextStep}
        />
      ),
    },
    {
      type: 'step',
      header: 'Select "User Management Starter"',
      show: () => (
        <Browser
          url="https://app.supabase.com/project/fwobemhztvkziokpwsfc/sql"
          screen="editor"
          onEvent={nextStep}
        />
      ),
    },
    {
      type: 'step',
      header: 'Run the query',
      show: () => (
        <Browser
          url="https://app.supabase.com/project/fwobemhztvkziokpwsfc/sql"
          screen="query"
          onEvent={nextStep}
        />
      ),
      children: (
        <>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed condimentum, nisl ut
            aliquam lacinia, nunc nisl aliquet nisl.
          </p>
          <p>
            Nec tincidunt nunc nisl eget nunc. Donec auctor, nisl eget aliquam tincidunt, nunc nisl
            aliquet nisl, nec tincidunt nunc nisl eget nunc.
          </p>
        </>
      ),
    },
  ],
}
