---
id: 'prisma'
title: 'Prisma'
description: 'Prisma Quickstart'
breadcrumb: 'ORM Quickstarts'
hideToc: true
---

This quickly shows how to connect your Prisma application to Supabase Postgres. If you encounter any problems, reference the [Prisma troubleshooting docs](/docs/guides/database/prisma/prisma-troubleshooting).

<Admonition type="note">

If you plan to solely use Prisma instead of the Supabase Data API (PostgREST), turn it off in the [API Settings](/dashboard/project/_/settings/api).

</Admonition>

<StepHikeCompact>
  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Create a custom user for Prisma">
      - In the [SQL Editor](/dashboard/project/_/sql/new), create a Prisma DB user with full privileges on the public schema.
      - This gives you better control over Prisma's access and makes it easier to monitor using Supabase tools like the [Query Performance Dashboard](/dashboard/project/_/advisors/query-performance) and [Log Explorer](/dashboard/project/_/logs/explorer).
      <Admonition type="note" label="password manager">

        For security, consider using a [password generator](https://bitwarden.com/password-generator/) for the Prisma role.

      </Admonition>

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>
      ```sql
      -- Create custom user
      create user "prisma" with password 'custom_password' bypassrls createdb;

      -- extend prisma's privileges to postgres (necessary to view changes in Dashboard)
      grant "prisma" to "postgres";

      -- Grant it necessary permissions over the relevant schemas (public)
      grant usage on schema public to prisma;
      grant create on schema public to prisma;
      grant all on all tables in schema public to prisma;
      grant all on all routines in schema public to prisma;
      grant all on all sequences in schema public to prisma;
      alter default privileges for role postgres in schema public grant all on tables to prisma;
      alter default privileges for role postgres in schema public grant all on routines to prisma;
      alter default privileges for role postgres in schema public grant all on sequences to prisma;
      ```

      ```sql
      -- alter prisma password if needed
      alter user "prisma" with password 'new_password';
      ```
    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

    <StepHikeCompact.Step step={2}>
        <StepHikeCompact.Details title="Create a Prisma Project">
        Create a new Prisma Project on your computer
        </StepHikeCompact.Details>

        <StepHikeCompact.Code>

            Create a new directory
            ```bash Terminal
            mkdir hello-prisma
            cd hello-prisma
            ```

            Initiate a new Prisma project
          <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId="npm_initiate"
            queryGroup="initiate"
          >
            <TabPanel id="npm_initiate" label="npm">
              ```bash
              npm init -y
              npm install prisma typescript ts-node @types/node --save-dev

              npx tsc --init

              npx prisma init
              ```
            </TabPanel>
            <TabPanel id="pnpm_initiate" label="pnpm">
              ```bash
              pnpm init -y
              pnpm install prisma typescript ts-node @types/node --save-dev

              pnpx tsc --init

              pnpx prisma init
              ```
            </TabPanel>
            <TabPanel id="yarn_initiate" label="yarn">
              ```bash
              yarn init -y
              yarn add prisma typescript ts-node @types/node --save-dev

              npx tsc --init

              npx prisma init
              ```
            </TabPanel>
            <TabPanel id="bun_initiate" label="bun">
              ```bash
              bun init -y
              bun install prisma typescript ts-node @types/node --save-dev

              bunx tsc --init

              bunx prisma init
              ```
            </TabPanel>
          </Tabs>
        </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Add your connection information to your .env file">
    - On your project dashboard, click [Connect](/dashboard/project/_?showConnect=true)
    - Find your Supavisor Session pooler string. It should end with 5432. It will be used in your `.env` file.
    <Admonition type="note">

      If you're in an [IPv6 environment](https://github.com/orgs/supabase/discussions/27034) or have the IPv4 Add-On, you can use the direct connection string instead of Supavisor in Session mode.

    </Admonition>

    - If you plan on deploying Prisma to a serverless or auto-scaling environment, you'll also need your Supavisor transaction mode string.
    - The string is identical to the session mode string but uses port 6543 at the end.


    </StepHikeCompact.Details>

    <StepHikeCompact.Code>
            <Tabs>
                <TabPanel id="serverful" label="server-based deployments">
                  In your .env file, set the DATABASE_URL variable to your connection string
                    ```text .env
                    # Used for Prisma Migrations and within your application
                    DATABASE_URL="postgres://[DB-USER].[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
                    ```

                    Change your string's `[DB-USER]` to `prisma` and add the password you created in step 1
                    ```md
                    postgres://prisma.[PROJECT-REF]...
                    ```
                </TabPanel>
                <TabPanel id="serverless" label="serverless deployments">

                    Assign the connection string for Supavisor Transaction Mode (using port 6543) to the DATABASE_URL variable in your .env file. Make sure to append "pgbouncer=true" to the end of the string to work with Supavisor.

                    Next, create a DIRECT_URL variable in your .env file and assign the connection string that ends with port 5432 to it.

                    ```text .env # Used in your application (use transaction mode)
                    DATABASE_URL="postgres://[DB-USER].[PROJECT-REF]:[PRISMA-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

                    # Used for Prisma Migrations (use session mode or direct connection)
                    DIRECT_URL="postgres://[DB-USER].[PROJECT-REF]:[PRISMA-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
                    ```

                    Change both your strings' `[DB-USER]` to `prisma` and then add the password created in step 1
                    ```md
                    postgres://prisma.[PROJECT-REF]...
                    ```

                    In your schema.prisma file, edit your `datasource db` configs to reference your DIRECT_URL
                    ```text schema.prisma
                    datasource db {
                      provider  = "postgresql"
                      url       = env("DATABASE_URL")
                      directUrl = env("DIRECT_URL")
                    }
                    ```


                </TabPanel>

            </Tabs>




    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={4}>
    <StepHikeCompact.Details title="Create your migrations">

    If you have already modified your Supabase database, synchronize it with your migration file. Otherwise create new tables for your database

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

    <Tabs>

          <TabPanel id="new-projects" label="New Projects">
            Create new tables in your prisma.schema file

            ```ts prisma/schema.prisma
            model Post {
              id        Int     @id @default(autoincrement())
              title     String
              content   String?
              published Boolean @default(false)
              author    User?   @relation(fields: [authorId], references: [id])
              authorId  Int?
            }

            model User {
              id    Int     @id @default(autoincrement())
              email String  @unique
              name  String?
              posts Post[]
            }
            ```
            commit your migration

          <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId="npm_migrate"
            queryGroup="migrate"
          >
            <TabPanel id="npm_migrate" label="npm">
            ```bash
            npx prisma migrate dev --name first_prisma_migration

            ```
            </TabPanel>
            <TabPanel id="pnpm_migrate" label="pnpm">
            ```bash
            pnpx prisma migrate dev --name first_prisma_migration

            ```
            </TabPanel>
            <TabPanel id="yarn_migrate" label="yarn">
            ```bash
            npx prisma migrate dev --name first_prisma_migration

            ```
            </TabPanel>
            <TabPanel id="bun_migrate" label="bun">
            ```bash
            bunx prisma migrate dev --name first_prisma_migration

            ```
            </TabPanel>
          </Tabs>

</TabPanel>

          <TabPanel id="established-projects" label="Populated Projects">
            Synchronize changes from your project:
                          <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId="npm_sync"
            queryGroup="sync"
          >
          <TabPanel id="npm_sync" label="npm">
            ```bash
            npx prisma db pull
            ```

            Create a migration file
            ```bash
            mkdir -p prisma/migrations/0_init_supabase
            ```

            Synchronize the migrations
            ```bash
              npx prisma migrate diff \
              --from-empty \
              --to-schema prisma/schema.prisma \
              --script > prisma/migrations/0_init_supabase/migration.sql
            ```
            <Admonition type="tip" label="conflict management">

              If there are any conflicts, reference [Prisma's official doc](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#work-around-features-not-supported-by-prisma-schema-language) or the [trouble shooting guide](/docs/guides/database/prisma/prisma-troubleshooting) for more details

            </Admonition>

            ```bash
            npx prisma migrate resolve --applied 0_init_supabase
            ```
          </TabPanel>

          <TabPanel id="pnpm_sync" label="pnpm">
            ```bash
            pnpx prisma db pull
            ```

            Create a migration file
            ```bash
            mkdir -p prisma/migrations/0_init_supabase
            ```

            Synchronize the migrations
            ```bash
              pnpx prisma migrate diff \
              --from-empty \
              --to-schema prisma/schema.prisma \
              --script > prisma/migrations/0_init_supabase/migration.sql
            ```
            <Admonition type="note" label="conflict management">

              If there are any conflicts, reference [Prisma's official doc](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#work-around-features-not-supported-by-prisma-schema-language) or the [trouble shooting guide](/docs/guides/database/prisma/prisma-troubleshooting) for more details

            </Admonition>

            ```bash
            pnpx prisma migrate resolve --applied 0_init_supabase
            ```
          </TabPanel>

          <TabPanel id="yarn_sync" label="yarn">
            ```bash
            npx prisma db pull
            ```

            Create a migration file
            ```bash
            mkdir -p prisma/migrations/0_init_supabase
            ```

            Synchronize the migrations
            ```bash
              npx prisma migrate diff \
              --from-empty \
              --to-schema prisma/schema.prisma \
              --script > prisma/migrations/0_init_supabase/migration.sql
            ```
            <Admonition type="note" label="conflict management">

              If there are any conflicts, reference [Prisma's official doc](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#work-around-features-not-supported-by-prisma-schema-language) or the [trouble shooting guide](/docs/guides/database/prisma/prisma-troubleshooting) for more details

            </Admonition>

            ```bash
            npx prisma migrate resolve --applied 0_init_supabase
            ```
          </TabPanel>

          <TabPanel id="bun_sync" label="bun">
            ```bash
            bunx prisma db pull
            ```

            Create a migration file
            ```bash
            mkdir -p prisma/migrations/0_init_supabase
            ```

            Synchronize the migrations
            ```bash
              bunx prisma migrate diff \
              --from-empty \
              --to-schema prisma/schema.prisma \
              --script > prisma/migrations/0_init_supabase/migration.sql
            ```
            <Admonition type="note" label="conflict management">

              If there are any conflicts, reference [Prisma's official doc](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#work-around-features-not-supported-by-prisma-schema-language) or the [trouble shooting guide](/docs/guides/database/prisma-troubleshooting) for more details

            </Admonition>

            ```bash
            bunx prisma migrate resolve --applied 0_init_supabase
            ```
          </TabPanel>
          </Tabs>

        </TabPanel>

    </Tabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
  <StepHikeCompact.Step step={5}>
    <StepHikeCompact.Details title="Install the prisma client">
    Install the Prisma client and generate its model
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>
              <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId="npm_client"
            queryGroup="client"
          >
      <TabPanel id="npm_client" label="npm">
          ```sh
          npm install @prisma/client
          npx prisma generate
          ```
      </TabPanel>
      <TabPanel id="pnpm_client" label="pnpm">
          ```sh
          pnpm install @prisma/client
          pnpx prisma generate
          ```
      </TabPanel>
      <TabPanel id="yarn_client" label="yarn">
          ```sh
          yarn add @prisma/client
          npx prisma generate
          ```
      </TabPanel>
      <TabPanel id="bun_client" label="bun">
          ```sh
          bun install @prisma/client
          bunx prisma generate
          ```
      </TabPanel>
      </Tabs>
    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
    <StepHikeCompact.Step step={6}>
    <StepHikeCompact.Details title="Test your API">
      Create a index.ts file and run it to test your connection
    </StepHikeCompact.Details>
    <StepHikeCompact.Code>
      ```ts index.ts
      const { PrismaClient } = require('@prisma/client');

      const prisma = new PrismaClient();

      async function main() {
        //change to reference a table in your schema
        const val = await prisma.<SOME_TABLE_NAME>.findMany({
          take: 10,
        });
        console.log(val);
      }

      main()
        .then(async () => {
          await prisma.$disconnect();
        })
        .catch(async (e) => {
          console.error(e);
          await prisma.$disconnect();
        process.exit(1);
      });

      ```
    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

</StepHikeCompact>
