---
title: Offline-first React Native Apps with Expo, WatermelonDB, and Supabase
description: Store your data locally and sync it with Postgres using WatermelonDB!
author: benediktmueller
imgSocial: 2023-10-08-react-native-offline-first-watermelon-db/expo-watermelondb-supabase.jpg
imgThumb: 2023-10-08-react-native-offline-first-watermelon-db/expo-watermelondb-supabase.jpg
categories:
  - developers
tags:
  - react-native
  - auth
  - offline
date: '2023-10-08'
toc_depth: 3
---

Using the [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction) in a React Native app, it's super easy to fetch data from a Supabase backend by simply calling functions like `supabase.from('countries').select()` wherever the data is needed. However, another approach to handling data in mobile apps recently gained a lot of popularity: Offline-first - meaning an app works primarily offline and synchronizes data whenever possible.

This has multiple advantages, the obvious being that the app can be used offline. But even when the app is used online, the user experience still profits from this approach as reading and updating data feels instantaneous as it happens on the device first and is then synced in the background. The approach also has drawbacks: Data can become stale, and if it is changed in multiple places while offline, data conflicts can occur.

There are sophisticated database technologies like CRDT (conflict-free replicated data type), which are also making their way into mobile apps. For our example, we will not reach for a CRDT and instead use WatermelonDB, an open-source solution built on SQLite that includes a sync engine and applies the simple strategy of just letting the latest change of a record win. Follow along to build a React Native/Expo app that uses WatermelonDB as the offline-first data store and syncs to a Supabase backend using Remote Procedure Calls and Supabase Realtime to trigger sync on other devices.

The approach described in this blog post was developed while building [Share My Stack](https://sharemystack.com/). This mobile app allows people to curate and share their personal productivity stack as well as their favorite development stack. The app is available on the [App Store](https://apps.apple.com/us/app/share-my-stack/id6450111644), and the complete source code is available on [GitHub](https://github.com/bndkt/sharemystack/) for educational purposes. Here is a little demo of what the result looks like when using the app on two separate devices:

<video width="99%" muted playsInline controls={true}>
  <source
    src="/images/blog/2023-10-08-react-native-offline-first-watermelon-db/sync.mp4"
    type="video/mp4"
  />
</video>

For this tutorial, we'll be implementing a small part of the Share My Stack data model, namely the ability to have a "profile," which belongs to a "user" (stored in auth.users) and can have multiple "stacks" associated with it (see the output from the Supabase Schema Visualizer below for illustration). With that said, let's dive into building our local-first app ...

![database schema](/images/blog/2023-10-08-react-native-offline-first-watermelon-db/schema.png)

## Create a React Native/Expo app

```sh
npx create-expo-app OfflineFirstWithSupabase
```

## Add required dependencies

The first step is to add the required dependencies to your React Native project: WatermelonDB, Supabase, and expo-build-properties, which we'll use in the next step to customize the React Native app build.

```sh
npm install @nozbe/watermelondb @supabase/supabase-js expo-build-properties
```

## Setting up WatermelonDB native dependencies

WatermelonDB is depending on simdjson, which needs to be added to the Podfile of the React Native project. Using expo-build-properties, this can be done with a simple configuration change without touching native iOS project files.

```json filename="app.json"
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "extraPods": [
              {
                "name": "simdjson",
                "configurations": ["Debug", "Release"],
                "path": "../node_modules/@nozbe/simdjson",
                "modular_headers": true
              }
            ]
          }
        }
      ]
    ]
  }
}
```

## Creating the WatermelonDB data model

WatermelonDB requires models to be created for the data that is stored and synced through it. Take a look at their [docs](https://watermelondb.dev/docs/Model) for the details; here is an excerpt of the model used in Share My Stack, which represents a "profile" that has multiple "stacks" associated with it:

```typescript
import { Model, Q, Relation } from "@nozbe/watermelondb";
import { date, readonly, text } from "@nozbe/watermelondb/decorators";

import { Stack } from "./Stack";

export class Profile extends Model {
static table = "profiles";

@readonly @date("created_at") createdAt!: Date;
@readonly @date("updated_at") updatedAt!: Date;

static associations = {
	["stacks"]: {
		type: "has_many" as const,
		foreignKey: "profile_id",
	}
};

@text("name") name!: string;
@text("website") website!: string;
```

## Syncing the local DB with Supabase

The [WatermelonDB docs](https://watermelondb.dev/docs/) outline how to set up a sync function that talks with the backend server. In our case, the backend is a Postgres database hosted on Supabase. As indicated earlier, we'll implement the sync via two [Postgres functions](https://supabase.com/docs/guides/database/functions) called via Supabase RPC. This way, each sync is only two database calls (one push, one pull), and most of the logic is carried out directly within the database.

```typescript
import { SyncDatabaseChangeSet, synchronize } from '@nozbe/watermelondb/sync'

await synchronize({
  database,
  pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
    const { data, error } = await supabase.rpc('pull', {
      last_pulled_at: lastPulledAt,
    })

    const { changes, timestamp } = data as {
      changes: SyncDatabaseChangeSet
      timestamp: number
    }

    return { changes, timestamp }
  },
  pushChanges: async ({ changes, lastPulledAt }) => {
    const { error } = await supabase.rpc('push', { changes })
  },
  sendCreatedAsUpdated: true,
})
```

For the local synchronize function to be able to call Postgres functions (pull and push) via supabase.rpc(), those functions have to be created via migrations before. The specific implementation of those functions will be based on the schema of the data. The push function basically receives a set of data changes as a JSON object and writes them to the database, while the pull function receives the timestamp of the last sync and compiles a JSON object containing all changes the database has accumulated since this timestamps and returns it to the client.

Here is an example of a push function. This function implements the creation, deletion, and updating of profiles and would need to be extended for every additional object in the data model.

```sql
create or replace function push(changes jsonb) returns void as $$
declare new_profile jsonb;
declare updated_profile jsonb;
begin
-- create profiles
for new_profile in
select jsonb_array_elements((changes->'profiles'->'created')) loop perform create_profile(
        (new_profile->>'id')::uuid,
        (new_profile->>'user_id')::uuid,
        (new_profile->>'name'),
        (new_profile->>'website'),
        epoch_to_timestamp(new_profile->>'created_at'),
        epoch_to_timestamp(new_profile->>'updated_at')
    );
end loop;
-- delete profiles
with changes_data as (
    select jsonb_array_elements_text(changes->'profiles'->'deleted')::uuid as deleted
)
-- update profiles
update profiles
set deleted_at = now(),
    last_modified_at = now()
from changes_data
where profiles.id = changes_data.deleted;
end;
$$ language plpgsql;
```

And here is how the pull function might look like:

```sql
create or replace function pull(last_pulled_at bigint default 0) returns jsonb as $$
declare _ts timestamp with time zone;
_profiles jsonb;
begin -- timestamp
_ts := to_timestamp(last_pulled_at / 1000);
--- profiles
select jsonb_build_object(
        'created',
        '[]'::jsonb,
        'updated',
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id',
                    t.id,
                    'name',
                    t.name,
                    'website',
                    t.website,
                    'created_at',
                    timestamp_to_epoch(t.created_at),
                    'updated_at',
                    timestamp_to_epoch(t.updated_at)
                )
            ) filter (
                where t.deleted_at is null
                    and t.last_modified_at > _ts
            ),
            '[]'::jsonb
        ),
        'deleted',
        coalesce(
            jsonb_agg(to_jsonb(t.id)) filter (
                where t.deleted_at is not null
                    and t.last_modified_at > _ts
            ),
            '[]'::jsonb
        )
    ) into _profiles
from sync_profiles_view t;
return jsonb_build_object(
    'changes',
    jsonb_build_object(
        'profiles',
        _profiles
    ),
    'timestamp',
    timestamp_to_epoch(now())
);
end;
$$ language plpgsql;
```

To convert between timestamp formats used by WatermelonDB and Supabase/Postgres, the push and pull functions use the following utility functions in Supabase:

```sql
create or replace function epoch_to_timestamp(epoch text) returns timestamp with time zone as $$ begin return timestamp with time zone 'epoch' + ((epoch::bigint) / 1000) * interval '1 second';
end;
$$ language plpgsql;

create or replace function timestamp_to_epoch(ts timestamp with time zone) returns bigint as $$ begin return (
        extract(
            epoch
            from ts
        ) * 1000
    )::bigint;
end;
$$ language plpgsql;
```

## Conclusion

I'm convinced local-first will be an increasingly important paradigm in the future - not for all apps, but at least for some. It can greatly enhance user experience with regards to reliability and performance and as we've seen in this tutorial, it doesn't need to be rocket science.

It does, however, come with its own set of trade-offs. One of the biggest drawbacks of the demonstrated approach, in my opinion, is the amount of friction it adds to changing the data model. Usually, when just adding the Supabase SDK, I add a new migration, re-generate the types, and use the data wherever I need to.

With the approach described above, I need to maintain the database schema in Supabase, and the local schema in WatermelonDB, and keep the sync functions up to date. In the end, for an app where the data model is not expected to change much and where very performant user interactions are key to adoption, this is still a very viable approach from my perspective.

## More React Native/Expo resources

- [Getting started with React Native authentication](https://supabase.com/blog/react-native-authentication)
- [React Native file upload with Supabase Storage](https://supabase.com/blog/react-native-storage)
- [React Native Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Watch our React Native video tutorials](https://youtube.com/playlist?list=PL5S4mPUpp4OsrbRTx21k34aACOgpqQGlx&si=Ez-0S4QhBxtayYsq)
