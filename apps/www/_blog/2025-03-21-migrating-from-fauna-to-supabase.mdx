---
title: 'Migrating from Fauna to Supabase'
description: 'A guide to migrating from Fauna to Supabase.'
author: prashant
imgSocial: fauna-transition/fauna-transition.png
imgThumb: fauna-transition/fauna-transition-thumb.png
categories:
  - migration
  - postgres
tags:
  - postgres
date: '2025-03-21'
toc_depth: 3
---

Fauna recently announced they will sunset their product by the end of May 2025, prompting engineering teams to find reliable alternatives quickly. Supabase offers a natural migration path for Fauna users, providing a robust, scalable, and open-source alternative built on Postgres.

## The implications of Fauna sunsetting

Fauna was known for its serverless database model, offering easy scalability, flexible data modeling, and integrated GraphQL APIs. Teams depending on Fauna must now evaluate alternatives carefully, considering impacts on data modeling, querying, and backend logic.

Migrating away from Fauna requires adjustments in query logic, schema definition, and overall application architecture.

## Why Supabase is a strong replacement for Fauna

Supabase is an open-source Postgres development platform that offers:

- **Managed Postgres database**: Stability, reliability, and strong SQL ecosystem with mature tooling.
- **Automatically generated REST APIs (via PostgREST)**: Direct analog to Fauna’s built-in API functionality.
- **Native JSONB Support:** Supabase supports JSONB data types as well as JSON functions and operators to efficiently query collection-style data, prior to full-fledged normalization.
- **Real-time database updates**, integrated authentication, secure file storage, and edge functions.
- **Row-level security**: Built directly into the database, allowing precise access control.
- **Robust TypeScript support**: Seamless integration with modern development workflows.
- **Full ACID compliance**: Stronger transactional guarantees than Fauna.
- **Predictable pricing**: Transparent, usage-based billing that avoids surprises.
- **Improved local and remote development workflow**: Efficient, predictable, and familiar to most developers.
- **Global community**. Supabase has a vibrant community of users and contributors around the world.

## Migrating from Fauna to Supabase: a step-by-step guide

Migrating across data structures can be difficult, and normalizing large sets of unstructured or semi-structured data can take time. Given the May 30th Fauna Sunset deadline, we recommend a two-phase approach to ensure your application stays online.

**Phase 1: Export and load Into Supabase**

In this phase, your data is safely moved to Supabase before the Fauna sunset date and your applications will still function properly.

1. Export data from Fauna
2. Import JSON data into Supabase
3. Transition existing Fauna API calls to Supabase PostgREST APIs

**Phase 2: Optimize and enhance**

In this phase, with your data secured and your applications still functional, you can safely and confidently complete the transition to Supabase.

1. SQL data normalization and PostgREST update
2. Incorporation of additional Supabase features such as authentication, and object storage

## Phase 1

Phase 1 of the Fauna to Supabase migration focuses on exporting your data from Fauna, importing into Supabase as a JSONB data type, and rewriting your data APIs to use the Supabase SDK.

### Step 1: Export data from Fauna

Fauna allows exporting collections through their admin dashboard or CLI. Use the Fauna CLI to export your collections to Amazon S3 in JSON format:

```
fauna export create s3 \
  --database <database_name> \
  --collection <collection_name> \
  --bucket <s3_bucket_name> \
  --path <s3_bucket_path> \
  --format simple
```

Fauna has [also provided instructions](https://docs.fauna.com/fauna/current/migrate/?lang=javascript) using the Fauna Query Language.

### Step 2: Import JSON Data into Supabase

Create a table in Supabase with a JSONB column to store raw Fauna documents:

```sql
create table fauna_users_raw (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null
);
```

Then, ingest the exported JSON data into this Supabase table using this custom script:

```jsx
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_API_KEY'
const tableName = 'YOUR_TABLE_NAME'
const jsonFilePath = './filename.json'

const supabase = createClient(supabaseUrl, supabaseKey)

async function loadDocumentsToSupabase() {
  try {
    // Read JSON file
    const rawData = fs.readFileSync(jsonFilePath)
    const dataArray = JSON.parse(rawData).map((data) => ({ data }))

    // Insert data into Supabase
    const { error } = await supabase.from(tableName).insert(dataArray)

    if (error) {
      console.error('Error inserting data:', error)
      return
    }

    console.log(`Successfully inserted ${dataArray.length} records into ${tableName}`)
  } catch (error) {
    console.error('Error in process:', error)
  }
}

loadDocumentsToSupabase()
```

### Step 3: Transition Fauna API calls to Supabase PostgREST

Once your data has been structured into tables, Supabase automatically generates REST APIs for each table via PostgREST, allowing effortless querying from your application.

Here’s a Fauna query example (using FQL) for obtaining data from a `users` table:

```jsx
import { Client, fql } from 'fauna'

const client = new Client({ secret: '<your-fauna-secret>' })

const usersQuery = fql`
  users.all() {
    name,
    email
  }
`

client
  .query(usersQuery)
  .then((data) => console.log(data))
  .catch((error) => console.error('Error fetching users:', error))
```

And here’s the equivalent Supabase REST API call:

```jsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://<your-project>.supabase.co', '<your-api-key>')

const { data, error } = await supabase.from('users').select(`
    user:  metadata->user
  `)
// the -> operator returns values as jsonb for the user collection

if (error) console.error(error)
else console.log(data)
```

## Phase 2:

Once you have brought your collections over to Supabase, you may find you would benefit from data normalization. As Supabase is built on top of Postgres, having normalized data will lead to significant performance benefits that cannot be matched by a set of collections stored in JSONB.

### Step 1: Normalize the data using SQL

Once your data is imported as JSONB, leverage the powerful Postgres JSON functions to incrementally normalize and populate relational tables. In this example, we’re importing data from a rudimentary `users` table:

```sql
-- Example normalization for users
INSERT INTO users (name, email)
SELECT
  data->'data'->'name' AS name,
  data->'data'->'email' AS email
FROM fauna_users_raw;

-- Example normalization of nested orders
INSERT INTO orders (user_id, product, quantity)
SELECT
  u.id,
  order_data->>'product',
  (order_data->>'quantity')::INTEGER
FROM fauna_users_raw f
JOIN users u ON (f.data->'data'->>'email') = u.email,
LATERAL jsonb_array_elements(f.data->'data'->'orders') AS order_data;

```

### Step 1.5: Rewrite PostgREST to query normalized data

Once your data has been structured into tables, Supabase automatically generates REST APIs for each table via PostgREST, allowing effortless querying from your application.

Here’s the PostgREST query for JSONB data from Phase 1:

```jsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://<your-project>.supabase.co', '<your-api-key>')

const { data, error } = await supabase.from('users').select(`
    user:  metadata->user
  `)
// the -> operator returns values as jsonb for the user collection

if (error) console.error(error)
else console.log(data)
```

And here’s the equivalent Supabase REST API call with normalized data:

```jsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://<your-project>.supabase.co', '<your-api-key>')

const { data, error } = await supabase.from('users').select('name, email')

if (error) console.error(error)
else console.log(data)
```

### Step 2: Add more Supabase features

Once your data is migrated, you can start to use Supabase to its fullest:

- [**Authentication**](https://supabase.com/auth). Let your users login with email, Google, Apple, GitHub, and more. Secure and trusted.
- [**Role-Based Access Control (RBAC)**](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac). Secure your data properly.
- [**Storage**](https://supabase.com/storage). Affordable and fast, for all the videos and images you need in your app.
- [**Edge Functions**](https://supabase.com/edge-functions). Custom backend logic when you want to dive into code.
- [**Realtime**](https://supabase.com/realtime). Build immersive multi-player, collaborative experiences.
- [**AI Ready**](https://supabase.com/modules/vector). When you’re ready to explore vectors and the power of AI, Supabase is there with industry-standard tools to guide you.
- [**Foreign Data Wrappers (FDW)**](https://supabase.com/docs/guides/database/extensions/wrappers/overview). Pull data from Google Sheets, Airtable, MySQL, and more, as if they were part of Supabase natively.
- **Instant and secure deployment**. No need to set up servers, manage DevOps, or tweak security settings.

## Key considerations and trade-offs

- **Schema Flexibility**: Postgres schemas require careful planning compared to Fauna’s more flexible data structures.
- **Migration Complexity**: Fauna’s nested structures necessitate normalization scripts.
- **Query Refactoring**: Fauna’s FQL/GraphQL queries must be translated to SQL queries.
- **Add indexes**: Use the Index Advisor in the Supabase Dashboard to further optimize your tables.

## Conclusion

This is no doubt a stressful time as you transition away from Fauna. Supabase is here to help you every step of the way. Reach out to us and we can help you plan your transition and provide assistance.

Supabase is a comprehensive, scalable replacement for Fauna. Supabase is built on Postgres and offers a robust relational model, powerful security features, and predictable pricing. Supabase enables engineering teams to confidently transition away from Fauna thanks to its SQL ecosystem, more mature/better tooling, row level security, strong typescript support, and full ACID compliance. Thoughtful planning and methodical execution will ensure a seamless migration and long-term reliability.
