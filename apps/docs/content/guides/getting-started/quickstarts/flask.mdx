---
title: 'Use Supabase with Python'
subtitle: 'Learn how to create a Supabase project, add some sample data to your database, and query the data from a Python app.'
breadcrumb: 'Framework Quickstarts'
hideToc: true
---

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>

    <$Partial path="quickstart_db_setup.mdx" />

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={2}>

    <StepHikeCompact.Details title="Create a Python app with Flask">

    Create a new directory for your Python app and set up a virtual environment.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      mkdir my-app && cd my-app
      python3 -m venv venv
      source venv/bin/activate
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Install Flask and the Supabase client library">

    The fastest way to get started is to use Flask for the web framework and the `supabase-py` client library which provides a convenient interface for working with Supabase from a Python app.

    Install both packages using pip.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      pip install flask supabase
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={4}>
    <StepHikeCompact.Details title="Create Environment Variables file">

    Create a `.env` file in your project root and populate it with your Supabase connection variables:

    <ProjectConfigVariables variable="url" />
    <ProjectConfigVariables variable="publishable" />
    <ProjectConfigVariables variable="anon" />

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      <$CodeTabs>

        ```text name=.env
        SUPABASE_URL=<SUBSTITUTE_SUPABASE_URL>
        SUPABASE_PUBLISHABLE_KEY=<SUBSTITUTE_SUPABASE_PUBLISHABLE_KEY>
        ```

      </$CodeTabs>

      <$Partial path="api_settings_steps.mdx" variables={{ "framework": "", "tab": "" }} />

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={5}>
    <StepHikeCompact.Details title="Query data from the app">

    Install the `python-dotenv` package to load environment variables:

    ```bash
    pip install python-dotenv
    ```

    Create an `app.py` file and add a route that fetches data from your `instruments` table using the Supabase client.

    </StepHikeCompact.Details>
    <StepHikeCompact.Code>

      ```python name=app.py
      import os
      from flask import Flask
      from supabase import create_client, Client
      from dotenv import load_dotenv

      load_dotenv()

      app = Flask(__name__)

      supabase: Client = create_client(
          os.environ.get("SUPABASE_URL"),
          os.environ.get("SUPABASE_PUBLISHABLE_KEY")
      )

      @app.route('/')
      def index():
          response = supabase.table('instruments').select("*").execute()
          instruments = response.data

          html = '<h1>Instruments</h1><ul>'
          for instrument in instruments:
              html += f'<li>{instrument["name"]}</li>'
          html += '</ul>'

          return html

      if __name__ == '__main__':
          app.run(debug=True)
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={6}>
    <StepHikeCompact.Details title="Start the app">

    Run the Flask development server, go to http://localhost:5000 in a browser and you should see the list of instruments.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      python app.py
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

## Next steps

- Set up [Auth](/docs/guides/auth) for your app
- [Insert more data](/docs/guides/database/import-data) into your database
- Upload and serve static files using [Storage](/docs/guides/storage)
