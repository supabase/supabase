---
title: 'Build an API route in less than 2 minutes.'
subtitle: 'Create your first API route by creating a public `leaderboard` table.'
breadcrumb: 'API Quickstart'
hideToc: true
---

This guide covers creating a REST route you can query using `cURL` or the browser by creating a database table called `leaderboard` to hold player scores. This creates a corresponding API route `/rest/v1/leaderboard` which can accept `GET`, `POST`, `PATCH`, and `DELETE` requests.

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Set up a Supabase project with a 'leaderboard' table">

    [Create a new project](/dashboard/_) in the Supabase Dashboard.

After your project is ready, create a table in your Supabase database. You can do this with either the [Table Editor](/dashboard/project/_/editor) or the [SQL Editor](/dashboard/project/_/sql).

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      <Tabs
        scrollable
        size="small"
        type="underlined"
        defaultActiveId="sql"
        queryGroup="database-method"
      >
      <TabPanel id="sql" label="SQL">

      ```sql
      -- Create a "leaderboard" table to store
      -- player names and their scores.
      create table leaderboard (
        id serial primary key,
        player text not null,
        score integer not null default 0,
        created_at timestamptz default now()
      );
      ```

      </TabPanel>
      <TabPanel id="dashboard" label="Dashboard">

      1. Go to the [**Table editor**](/dashboard/project/_/editor) section in the Dashboard.
      2. Click **New Table** and create a table with the name `leaderboard`.
      3. Add a `player` column of type `text` and a `score` column of type `int4`.
      4. Click **Save**.

      </TabPanel>
      </Tabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={2}>
    <StepHikeCompact.Details title="Enable Data API access to Anon Role">

    Expose the `leaderboard` table through the Data API so it can be queried over HTTP. A leaderboard is meant to be public, so anonymous clients only need read access.

    For more control over which tables and functions are exposed, read the [Grant access explicitly guide](/docs/guides/api/securing-your-api#grant-access-explicitly).

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      <Tabs
        scrollable
        size="small"
        type="underlined"
        defaultActiveId="sql"
        queryGroup="database-method"
      >
      <TabPanel id="sql" label="SQL">

      ```sql
      -- Allow read-only access for anonymous clients
      grant select on public.leaderboard to anon;
      ```

      </TabPanel>
      <TabPanel id="dashboard" label="Dashboard">

      In the [**Integrations > Data API > Settings**](/dashboard/project/_/integrations/data_api/settings) section of the Dashboard. Under **Exposed schemas**, make sure `public` is included, then under **Exposed tables**, toggle on access for the `leaderboard` table.

      </TabPanel>
      </Tabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>

    <StepHikeCompact.Details title="Configure RLS">

    Enable Row Level Security (RLS) for this table and create the policies that control who can read and write rows. For a leaderboard, anyone should be able to read scores. Only authenticated users should be able to submit or update them.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```sql
      -- Turn on RLS
      alter table "leaderboard"
      enable row level security;

      -- Anyone can read the leaderboard
      create policy "Leaderboard is public"
        on leaderboard
        for select
        to anon, authenticated
        using (true);

      -- Authenticated users can submit and update scores
      create policy "Authenticated users can submit scores"
        on leaderboard
        for insert
        to authenticated
        with check (true);

      create policy "Authenticated users can update scores"
        on leaderboard
        for update
        to authenticated
        using (true)
        with check (true);
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={4}>
    <StepHikeCompact.Details title="Enable Data API access for authenticated and service roles">

    With RLS setup, grant write access to the `authenticated` and `service_role` roles.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```sql
      -- Grant write access only after RLS and policies are in place
      grant select, insert, update, delete on public.leaderboard to authenticated;
      grant select, insert, update, delete on public.leaderboard to service_role;
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={5}>
    <StepHikeCompact.Details title="Insert some dummy data">

    Now add some scores to the table so the API has something to query.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```sql
      insert into leaderboard (player, score)
      values
        ('alice', 4200),
        ('bob', 3700),
        ('carol', 5100),
        ('dave', 2900);
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={6}>
    <StepHikeCompact.Details title="Fetch the data">

    You can find your API URL and Keys in the [**Settings > API Settings**](/dashboard/project/_/settings/api) section of the Dashboard. Query the `leaderboard` table by appending `/rest/v1/leaderboard` to the API URL.

    Copy this block of code, substitute `<PROJECT_REF>` and `<PUBLISHABLE_KEY>`, then run it from a terminal.

    </StepHikeCompact.Details>
    <StepHikeCompact.Code>

      ```bash Terminal
      curl 'https://<PROJECT_REF>.supabase.co/rest/v1/leaderboard?select=*&order=score.desc' \
      -H "apikey: <PUBLISHABLE_KEY>"
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

</StepHikeCompact>

## Bonus

There are several options for accessing your data:

### Browser

You can query the route in your browser, by appending the `publishable` key as a query parameter:

`https://<PROJECT_REF>.supabase.co/rest/v1/leaderboard?apikey=<PUBLISHABLE_KEY>`

### Curl

```sh
curl 'https://<PROJECT_REF>.supabase.co/rest/v1/leaderboard?select=*&order=score.desc' \
  -H "apikey: <PUBLISHABLE_KEY>" \
```

### Client libraries

We provide a number of [Client Libraries](https://github.com/supabase/supabase#client-libraries).

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase
  .from('leaderboard')
  .select()
  .order('score', { ascending: false })
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
final data = await supabase
  .from('leaderboard')
  .select('*')
  .order('score', ascending: false);
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
response = (
    supabase.table('leaderboard')
    .select("*")
    .order('score', desc=True)
    .execute()
)
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
let response = try await supabase
  .from("leaderboard")
  .select()
  .order("score", ascending: false)
```

</TabPanel>
</$Show>
</Tabs>
