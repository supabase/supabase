---
id: installing
title: 'Installing & Initialization'
slug: installing
custom_edit_url: https://github.com/supabase/supabase/edit/master/web/spec/supabase.yml
---

### Install from NuGet

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

    You can install Supabase package from [nuget.org](https://www.nuget.org/packages/supabase/)

  </RefSubLayout.Details>

  <RefSubLayout.Examples>

    <Tabs
      size="small"
      type="underlined"
      defaultActiveId="csharp"
      queryGroup="language"
    >
      <TabPanel id="csharp" label="Terminal">

        ```sh Terminal
        dotnet add package supabase
        ```

      </TabPanel>
    </Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

### Enable Data API access

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

    supabase-csharp uses the Data API to query and mutate your Postgres data. You first need to grant Data API roles permissions to access your tables and functions.

    In the [**Integrations > Data API**](/dashboard/project/_/integrations/data_api/settings) section of the Dashboard, expose the specific tables and functions you want to access. To automatically grant access for new tables and functions in `public`, enable **Default privileges for new entities**.

    Alternatively, use SQL to grant the required permissions:

  </RefSubLayout.Details>

  <RefSubLayout.Examples>

    ```sql
    -- Before granting access to client roles, make sure RLS is enabled
    -- and create the policies required for each role's allowed operations.
    alter table public.your_table enable row level security;
    -- create policy ... on public.your_table ...;

    -- Grant least-privilege access to tables after RLS and policies are in place
    grant select on public.your_table to anon;
    grant select, insert, update, delete on public.your_table to authenticated;
    grant all on public.your_table to service_role;

    -- Grant execute on functions after verifying any table access they rely on
    grant execute on function public.your_function to authenticated, service_role;
    ```

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>
