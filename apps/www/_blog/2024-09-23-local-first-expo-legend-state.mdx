---
title: 'Local-first Realtime Apps with Expo and Legend-State'
description: 'Build local-first realtime web and mobile apps with Expo, Legend-State, and Supabase.'
author: jay_meistrich,thor_schaeff
imgSocial: local-first-expo-legend_state/local-first-expo-legend_state-thumb.png
imgThumb: local-first-expo-legend_state/local-first-expo-legend_state-thumb.png
categories:
  - developers
tags:
  - mobile
  - local-first
  - react-native
date: '2024-09-23'
toc_depth: 3
---

<Admonition>

[Do you prefer audio-visual learning? Watch the video guide!](https://supabase.link/local-first-expo-legend-state-yt)

[Or jump straight into the code](https://github.com/expo/examples/tree/master/with-legend-state-supabase)

Or run `npx create-expo-app --example with-legend-state-supabase` to create a new app with this example.

</Admonition>

[Legend-State](https://legendapp.com/open-source/state/v3/) is a super fast all-in-one state and sync library that lets you write less code to make faster apps. Legend-State has four primary goals:

1. As easy as possible to use.
1. The fastest React state library.
1. Fine-grained reactivity for minimal renders.
1. Powerful sync and persistence (with Supabase support built in!)

And, to put the cherry on top, it works with Expo and React Native (via [React Native Async Storage](https://github.com/react-native-async-storage/async-storage?tab=readme-ov-file#react-native-async-storage)). This makes it a perfect match for building local-first mobile and web apps.

## What is a Local-First Architecture?

In local-first software, "the availability of another computer should never prevent you from working" ([via Martin Kleppmann](https://www.youtube.com/watch?v=NMq0vncHJvU)). When you are offline, you can still read and write directly from/to a database on your device. You can trust the software to work offline, and you know that when you are connected to the internet, your data will be seamlessly synced and available on any of your devices running the app. When you're online, this architecture is well suited for "multiplayer" apps, as [popularized by Figma](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/).

To dig deeper into what local-first is and how it works, refer to the [Expo docs](https://docs.expo.dev/guides/local-first/).

## How Legend-State makes it work

A primary goal of Legend-State is to make automatic persisting and syncing both easy and very robust, as it's meant to be used to power all storage and sync of complex apps.

Any changes made while offline are persisted between sessions to be retried whenever connected. To do this, the sync system subscribes to changes on an observable, then on change goes through a multi-step flow to ensure that changes are persisted and synced.

1. Save the pending changes to local persistence.
1. Save the changes to local persistence.
1. Save the changes to remote persistence.
1. On remote save, set any needed changes (like updated_at) back into the observable and local persistence.
1. Clear the pending changes in local persistence.

## Setting up the Project

To set up a new React Native project you can use the `create-expo-app` utility. You can create a blank app or choose from different [examples](https://github.com/expo/examples).

For this tutorial, go ahead and create a new blank Expo app:

```bash
npx create-expo-app@latest --template blank
```

## Installing Dependencies

The main dependencies you need are [Legend State](https://www.npmjs.com/package/@legendapp/state) and [supabase-js](https://www.npmjs.com/package/@supabase/supabase-js). Additionally, to make things work for React Native, you will need [React Native Async Storage](https://github.com/react-native-async-storage/async-storage?tab=readme-ov-file#react-native-async-storage) and [react-native-get-random-values](https://www.npmjs.com/package/react-native-get-random-values) (to generate uuids).

Install the required dependencies via `expo install`:

```bash
npx expo install @legendapp/state@beta @supabase/supabase-js react-native-get-random-values @react-native-async-storage/async-storage
```

## Configuring Supabase

If you don't have a Supabase project already, head over to [database.new](https://database.new) and create a new project.

Next, create a `.env.local` file in the root of your project and add the following env vars. You can find these in your [Supabase dashboard](https://supabase.com/dashboard/project/_/settings/api).

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Next, set up a utils file to hold all the logic for interacting with Supabase, we'll call it `utils/SupaLegend.ts`.

```ts utils/SupaLegend.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)
```

## Configuring Legend-State

Legend-State is very versatile and allows you to choose different persistence and storage strategies. For this example, we'll use `React Native Async Storage` for local persistence across platforms and `supabase` for remote persistence.

Extend your `utils/SupaLegend.ts` file with the following configuration:

```ts utils/SupaLegend.ts
import { createClient } from '@supabase/supabase-js'
import { observable } from '@legendapp/state'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { configureSynced } from '@legendapp/state/sync'
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

// Create a configured sync function
const customSynced = configureSynced(syncedSupabase, {
  // Use React Native Async Storage
  persist: {
    plugin: observablePersistAsyncStorage({
      AsyncStorage,
    }),
  },
  generateId,
  supabase,
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  // Optionally enable soft deletes
  fieldDeleted: 'deleted',
})

export const todos$ = observable(
  customSynced({
    supabase,
    collection: 'todos',
    select: (from) => from.select('id,counter,text,done,created_at,updated_at,deleted'),
    actions: ['read', 'create', 'update', 'delete'],
    realtime: true,
    // Persist data and pending changes locally
    persist: {
      name: 'todos',
      retrySync: true, // Persist pending changes and retry
    },
    retry: {
      infinite: true, // Retry changes with exponential backoff
    },
  })
)
```

<Admonition type="info">

`syncedSupabase` is the Legend-State sync plugin for Supabase and adds some default configuration for usage with supabase-js.

</Admonition>

## Setting up the Database Schema

If you haven't alread, install the [Supabase CLI](/docs/guides/cli/getting-started) and run `supabase init` to initialize your project.

Next, create the initial database migration to set up the `todos` table:

```bash
supabase migrations new init
```

This will create a new SQL migration file in the `supabase/migrations` directory. Open it and add the following SQL code:

```sql
create table todos (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  text text,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false -- needed for soft deletes
);

-- Enable realtime
alter
  publication supabase_realtime add table todos;

-- Legend-State helper to facilitate "Sync only diffs" (changesSince: 'last-sync') mode
CREATE OR REPLACE FUNCTION handle_times()
    RETURNS trigger AS
    $$
    BEGIN
    IF (TG_OP = 'INSERT') THEN
        NEW.created_at := now();
        NEW.updated_at := now();
    ELSEIF (TG_OP = 'UPDATE') THEN
        NEW.created_at = OLD.created_at;
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
    END;
    $$ language plpgsql;

CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON todos
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();
```

The `created_at`, `updated_at`, and `deleted` columns are used by Legend-State to track changes and sync efficiently. The `handle_times` function is used to automatically set the `created_at` and `updated_at` columns when a new row is inserted or an existing row is updated. This allows to efficiently sync only the changes since the last sync.

Next, run `supabase link` to link your local project to your Supabase project and run `supabase db push` to apply the init migration to your Supabase database.

## Generating TypeScript Types

Legend-State integrates with supabase-js to provide end-to-end type safety. This means you can use the existing [Supabase CLI workflow](/docs/guides/api/rest/generating-types) to generate TypeScript types for your Supabase tables.

```bash
supabase start
supabase gen types --lang=typescript --local > utils/database.types.ts
```

Next, in your `utils/SupaLegend.ts` file, import the generated types inject them into the Supabase client.

```ts utils/SupaLegend.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
// [...]

const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

// [...]
```

From here, Legend-State will automatically infer the types for your Supabase tables and make them available within the observable.

## Fetching Data and subscribing to realtime updates

Above, you've configured the `todos$` observable. You can now import this in your `tsx` files to fetch and automatically sync changes.

```tsx App.tsx
import { observer } from '@legendapp/state/react'
import { todos$ as _todos$ } from './utils/SupaLegend'

const Todos = observer(({ todos$ }: { todos$: typeof _todos$ }) => {
  // Get the todos from the state and subscribe to updates
  const todos = todos$.get()
  const renderItem = ({ item: todo }: { item: Tables<'todos'> }) => <Todo todo={todo} />
  if (todos)
    return <FlatList data={Object.values(todos)} renderItem={renderItem} style={styles.todos} />

  return <></>
})
```

`observer` is the suggested way of consuming observables for the best performance and safety.

It turns the entire component into an observing context - it automatically tracks observables for changes when `get()` is called, even from within hooks or helper functions.

This means, as long as realtime is enabled on the respective table, the component will automatically update when changes are made to the data!

Also, thanks to the persist and retry settings above, Legend-State will automatically retry to sync changes if the connection is lost.

## Inserting, and updating data

To add a new todo from the application, you will need to generate a uuid locally to insert it into our todos observable. You can use the `uuid` package to generate a uuid. For this to work in React Native you will also need the `react-native-get-random-values` polyfill.

In your `SupaLegend.ts` file add the following:

```ts utils/SupaLegend.ts
// [...]
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'
// [...]

// Provide a function to generate ids locally
const generateId = () => uuidv4()

export function addTodo(text: string) {
  const id = generateId()
  // Add keyed by id to the todos$ observable to trigger a create in Supabase
  todos$[id].assign({
    id,
    text,
  })
}

export function toggleDone(id: string) {
  todos$[id].done.set((prev) => !prev)
}
```

Now, in your `App.tsx` file, you can import the `addTodo` and `toggleDone` methods and call them when the user submits a new todo or checks off one:

```tsx App.tsx
import { useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'
// [...]
import { observer } from '@legendapp/state/react'
import { addTodo, todos$ as _todos$, toggleDone } from './utils/SupaLegend'
// [...]

// Emojis to decorate each todo.
const NOT_DONE_ICON = String.fromCodePoint(0x1f7e0)
const DONE_ICON = String.fromCodePoint(0x2705)

// The text input component to add a new todo.
const NewTodo = () => {
  const [text, setText] = useState('')
  const handleSubmitEditing = ({ nativeEvent: { text } }) => {
    setText('')
    addTodo(text)
  }
  return (
    <TextInput
      value={text}
      onChangeText={(text) => setText(text)}
      onSubmitEditing={handleSubmitEditing}
      placeholder="What do you want to do today?"
      style={styles.input}
    />
  )
}

// A single todo component, either 'not done' or 'done': press to toggle.
const Todo = ({ todo }: { todo: Tables<'todos'> }) => {
  const handlePress = () => {
    toggleDone(todo.id)
  }
  return (
    <TouchableOpacity
      key={todo.id}
      onPress={handlePress}
      style={[styles.todo, todo.done ? styles.done : null]}
    >
      <Text style={styles.todoText}>
        {todo.done ? DONE_ICON : NOT_DONE_ICON} {todo.text}
      </Text>
    </TouchableOpacity>
  )
}
```

## Up next: Adding Auth

Since Legend-State utilizes supabase-js under the hood, you can use [Supabase Auth](/docs/guides/auth) and [row level security](/docs/guides/database/postgres/row-level-security) to restrict access to the data.

For a tutorial on how to add user management to your Expo React Native application, refer to [this guide](/docs/guides/getting-started/tutorials/with-expo-react-native).

## Conclusion

Legend-State and Supabase are a powerful combination for building local-first applications. Legend-State pairs nicely with supabase-js, Supabase Auth and Supabase Realtime, allowing you to tap into the full power of the Supabase Stack while building fast and delightful applications that work across web and mobile platforms.

Want to learn more about Legend-State? Refer to their [docs](https://legendapp.com/open-source/state/v3/) and make sure to follow Jay Meistrich on [Twitter](https://twitter.com/jmeistrich)!

## More Supabase Resources

- [Expo User Management Tutorial](/docs/guides/getting-started/tutorials/with-expo-react-native)
- [React Native Auth](/blog/react-native-authentication)
- [React Native File Upload](/blog/react-native-storage)
