---
title: 'Migrating from the MongoDB Data API to Supabase'
description: 'A guide to migrating from the MongoDB Data API to Supabase.'
author: prashant
imgSocial: mongodb-data-api/mongodb-data-api.png
imgThumb: mongodb-data-api/mongodb-data-api-thumb.png
categories:
  - migration
  - postgres
tags:
  - postgres
date: '2025-03-20'
toc_depth: 3
---

MongoDB announced that their Data API and HTTPS Endpoints will reach end-of-life by September 30, 2025. This has left many engineering teams evaluating alternatives. Supabase includes [built-in support for REST APIs](https://supabase.com/features/auto-generated-rest-api) (via PostgREST), mirroring the core functionality previously provided by MongoDB's Data API.

## The implications of MongoDB's Data API deprecation

MongoDB's Data API allowed developers to interact with their Atlas databases through straightforward RESTful endpoints, simplifying integration across frontend, backend, and serverless applications. With its removal, developers must pivot to alternative methods such as native MongoDB drivers combined with backend frameworks (Express, SpringBoot, FastAPI), or third-party solutions like RESTHeart, Hasura, or Neurelo.

This shift requires substantial refactoring for teams that rely on the simplified REST interface.

## Supabase as a MongoDB alternative

Supabase is an open-source MongoDB alternative and offers:

- A managed Postgres database, eliminating vendor lock-in.
- Built-in REST API via open-source PostgREST, directly analogous to MongoDB's Data API.
- Real-time capabilities, authentication, file storage, and serverless functions—all tightly integrated.

Most notably, Supabase [automatically generates a RESTful API](https://supabase.com/docs/guides/api#rest-api-overview) from your database schema, powered by PostgREST, itself a stable open-source project with a strong community. This feature accelerates development by eliminating boilerplate code for basic CRUD operations. Supabase provides a near drop-in replacement for MongoDB’s Data API. The Supabase Data API also supports GraphQL and a host of mobile and web application frameworks.

In the end, you can focus on migrating your data, expose your data using Supabase’s Data API, and seamlessly integrate with your client applications.

## Migrating from MongoDB to Supabase: a step-by-step guide

To migrate to Supabase, you will need to:

1. Export your MongoDB data
2. Import JSON data into Supabase
3. Normalize the data using SQL
4. Transition your existing MongoDB Data API calls to Supabase PostgREST
5. Add more Supabase features to round out your app

### Step 1: Export your MongoDB data

Export MongoDB documents using mongoexport:

```bash
mongoexport --uri="mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>" \
  --collection=users \
  --jsonArray \
  --out=users.json
```

### Step 2: Import JSON data into Supabase

Create a table in Supabase with a JSONB column to store raw Mongo documents:

```sql
create table mongo_users_raw (
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

### Step 3: Normalize the data using SQL

Once your data is imported as JSONB, leverage PostgreSQL’s powerful JSON functions to incrementally normalize and populate relational tables:

```sql
-- Example to normalize user data
INSERT INTO users (name, email)
SELECT
  data->>'name' as name,
  data->>'email' as email
FROM mongo_users_raw;

-- Example to normalize orders into a separate table
INSERT INTO orders (user_id, product, quantity)
SELECT
  u.id,
  orders->>'product',
  (orders.value->>'quantity')::INTEGER
FROM mongo_users_raw m
JOIN users u ON (m.data->>'name') = u.name,
LATERAL jsonb_array_elements(m.data->'orders') AS order_data
```

### Step 4: Transition API calls to Supabase PostgREST

Once your data has been structured into tables, Supabase automatically generates REST APIs for each table via PostgREST, allowing effortless querying from your application.

For example, if you have a users table, querying user information using Supabase’s JavaScript library would look like this:

```jsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://<your-project>.supabase.co', '<your-api-key>')

// Fetch user named John along with their orders
const { data, error } = await supabase
  .from('users')
  .select(
    `
    id, name,
    orders (product, quantity)
  `
  )
  .eq('name', 'John')

if (error) {
  console.error(error)
} else {
  console.log(data)
}
```

Using the automatically generated Supabase REST APIs offers a clear migration path from MongoDB’s deprecated Data API.

### Step 5: Add more Supabase features

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

- **Schema flexibility**: PostgreSQL schemas are less flexible than MongoDB; careful upfront design mitigates this.
- **Complexity in migration**: Document structures require transformation scripts.
- **Query patterns**: Analyze existing MongoDB queries to optimize relational joins.
- **Add indexes**: Use the Index Advisor in the Supabase Dashboard to further optimize your tables.

## Conclusion

Supabase is an ideal replacement for MongoDB, especially considering the Data API deprecation. Supabase is built on Postgres, one of the world’s most powerful and scalable databases. In addition, Supabase’s Data API directly parallels MongoDB's Data API, offering a simplified transition path.

[This blog post](https://blog.mansueli.com/migrating-from-mongodb-to-supabase-with-postgresql) provides further detail on how to transition from MongoDB. If you’re encountering difficulty, feel free to reach out to us. We’d be happy to help.

With careful planning and methodical execution, engineering teams can navigate this migration confidently, leveraging Supabase as a trusted, long-term solution.
