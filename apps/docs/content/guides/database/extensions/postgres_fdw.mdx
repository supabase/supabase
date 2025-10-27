---
id: 'postgres_fdw'
title: 'postgres_fdw'
description: 'Query Postgres server from another'
---

The extension enables Postgres to query tables and views on a remote Postgres server.

## Enable the extension

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="database-method"
>
    <TabPanel id="dashboard" label="Dashboard">

        1. Go to the [Database](/dashboard/project/_/database/tables) page in the Dashboard.
        2. Click on **Extensions** in the sidebar.
        3. Search for "postgres_fdw" and enable the extension.

    </TabPanel>
    <TabPanel id="sql" label="SQL">

        ```sql
        -- Example: enable the "postgres_fdw" extension
        create extension if not exists postgres_fdw;

        -- Example: disable the "postgres_fdw" extension
        drop extension if exists postgres_fdw;
        ```

        Procedural languages are automatically installed within `pg_catalog`, so you don't need to specify a schema.

    </TabPanel>

</Tabs>

## Create a connection to another database

<StepHikeCompact>
    <StepHikeCompact.Step step={1}>
        <StepHikeCompact.Details title="Create a foreign server">

            Define the remote database address

        </StepHikeCompact.Details>
        <StepHikeCompact.Code>
            ```sql
                create server "<foreign_server_name>"
                foreign data wrapper postgres_fdw
                options (
                    host '<host>',
                    port '<port>',
                    dbname '<dbname>'
                );
            ```
        </StepHikeCompact.Code>
    </StepHikeCompact.Step>

    <StepHikeCompact.Step step={2}>
        <StepHikeCompact.Details title="Create a server mapping">
            Set the user credentials for the remote server
        </StepHikeCompact.Details>
        <StepHikeCompact.Code>
            ```sql
            create user mapping for "<dbname>"
            server "<foreign_server_name>"
            options (
                user '<db_user>',
                password '<password>'
            );
            ```
        </StepHikeCompact.Code>
    </StepHikeCompact.Step>

    <StepHikeCompact.Step step={3}>
        <StepHikeCompact.Details title="Import tables">
            Import tables from the foreign database
        </StepHikeCompact.Details>
        <StepHikeCompact.Code>
            Example: Import all tables from a schema
            ```sql
            import foreign schema "<foreign_schema>"
            from server "<foreign_server>"
            into "<host_schema>";
            ```

            Example: Import specific tables
            ```sql
            import foreign schema "<foreign_schema>"
            limit to (
                "<table_name1>",
                "<table_name2>"
            )
            from server "<foreign_server>"
            into "<host_schema>";
            ```
        </StepHikeCompact.Code>
    </StepHikeCompact.Step>
    <StepHikeCompact.Step step={4}>
        <StepHikeCompact.Details title="Query foreign table"/>
        <StepHikeCompact.Code>

            ```sql
            select * from "<foreign_table>"
            ```
        </StepHikeCompact.Code>
    </StepHikeCompact.Step>

</StepHikeCompact>

### Configuring execution options

#### Fetch_size

Maximum rows fetched per operation. For example, fetching 200 rows with `fetch_size` set to 100 requires 2 requests.

```sql
alter server "<foreign_server_name>"
options (fetch_size '10000');
```

#### Batch_size

Maximum rows inserted per cycle. For example, inserting 200 rows with `batch_size` set to 100 requires 2 requests.

```sql
alter server "<foreign_server_name>"
options (batch_size '1000');
```

#### Extensions

Lists shared extensions. Without them, queries involving unlisted extension functions or operators may fail or omit references.

```sql
alter server "<foreign_server_name>"
options (extensions 'vector, postgis');
```

For more server options, check the extension's [official documentation](https://www.postgresql.org/docs/current/postgres-fdw.html#POSTGRES-FDW)

## Resources

- Official [`postgres_fdw` documentation](https://www.postgresql.org/docs/current/postgres-fdw.html#POSTGRES-FDW)
