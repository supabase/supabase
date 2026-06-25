---
id: installing
title: 'Installing'
slug: installing
custom_edit_url: https://github.com/supabase/supabase/edit/master/apps/docs/spec/supabase_py_v2.yml
---

### Install with PyPi

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

    You can install supabase-py via the terminal. (for Python > 3.8)

  </RefSubLayout.Details>

  <RefSubLayout.Examples>

    <Tabs
      size="small"
      type="underlined"
      defaultActiveId="pip"
      queryGroup="platform"
    >
      <TabPanel id="pip" label="PIP">

        ```sh Terminal
        pip install supabase
        ```

      </TabPanel>
      <TabPanel id="conda" label="Conda">

        ```sh Terminal
        conda install -c conda-forge supabase
        ```

      </TabPanel>
    </Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

### Enable Data API access

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

    supabase-py uses the Data API to query and mutate your Postgres data. You first need to grant Data API roles permissions to access your tables and functions.

    In [Data API integrations settings](/dashboard/project/_/integrations/data_api/settings), expose the specific tables and functions you want to access. To automatically grant access for new tables and functions in `public`, enable **Default privileges for new entities**.

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
