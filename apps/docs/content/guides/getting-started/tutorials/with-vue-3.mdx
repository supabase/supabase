---
title: 'Build a User Management App with Vue 3'
description: 'Learn how to use Supabase in your Vue 3 App.'
---

<$Partial path="uiLibCta.mdx" />
<$Partial path="quickstart_intro.mdx" />

![Supabase User Management example](/docs/img/user-management-demo.png)

<Admonition type="note">

If you get stuck while working through this guide, you can find the [full example on GitHub](https://github.com/supabase/supabase/tree/master/examples/user-management/vue3-user-management).

</Admonition>

<$Partial path="project_setup.mdx" variables={{ "framework": "vuejs", "tab": "frameworks" }} />

## Building the app

Start building the Vue 3 app from scratch.

### Initialize a Vue 3 app

This guide uses [Vite with Vue 3 Template](https://vitejs.dev/guide/#scaffolding-your-first-vite-project) to initialize
an app called `supabase-vue-3`:

```bash
# npm 6.x
npm create vite@latest supabase-vue-3 --template vue

# npm 7+, extra double-dash is needed:
npm create vite@latest supabase-vue-3 -- --template vue

cd supabase-vue-3
```

Then install the only additional dependency: [supabase-js](https://github.com/supabase/supabase-js)

```bash
npm install @supabase/supabase-js
```

And finally save the environment variables in a `.env` file, you need the API URL and the key that you copied [earlier](#get-api-details).

<$CodeTabs>

```bash name=.env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

</$CodeTabs>

With the API credentials in place, create an `src/supabase.js` helper file to initialize the Supabase client. These variables are exposed
on the browser, and that's fine since you have [Row Level Security](/docs/guides/auth#row-level-security) enabled on the Database.

<$CodeSample
path="/user-management/vue3-user-management/src/supabase.js"
lines={[[1, -1]]}
meta="name=src/supabase.js"
/>

### App styling (optional)

An optional step is to update the CSS file `src/style.css` to make the app look better.
You can find the full contents of this file [in the example repository](https://raw.githubusercontent.com/supabase/supabase/master/examples/user-management/vue3-user-management/src/style.css).

### Set up a login component

Set up an `src/components/Auth.vue` component to manage to add Magic Links as an option, so users can sign in with their email without using passwords.

<$CodeSample
path="/user-management/vue3-user-management/src/components/Auth.vue"
lines={[[1, -1]]}
meta="name=src/components/Auth.vue"
/>

### Account page

After a user signs in, allow them to edit their profile details and manage their account.
Create a new `src/components/Account.vue` component to handle this.

<$CodeSample
path="/user-management/vue3-user-management/src/components/Account.vue"
lines={[[1, 3], [5, 76], [78, -1]]}
meta="name=src/components/Account.vue"
/>

## Profile photos

Next, add a way for users to upload a profile photo. Supabase configures every project with [Storage](/docs/guides/storage) for managing large files like photos and videos.

### Create an upload widget

Create a new `src/components/Avatar.vue` component that allows users to upload profile photos:

<$CodeSample
path="/user-management/vue3-user-management/src/components/Avatar.vue"
lines={[[1, -1]]}
meta="name=src/components/Avatar.vue"
/>

### Update the Account component

With the Avatar component created, update `src/components/Account.vue` to include it:

<$CodeSample
path="/user-management/vue3-user-management/src/components/Account.vue"
lines={[[1, -1]]}
meta="name=src/components/Account.vue"
/>

### Launch!

With all the components in place, update `App.vue`:

<$CodeSample
path="/user-management/vue3-user-management/src/App.vue"
lines={[[1, -1]]}
meta="name=src/App.vue"
/>

Once that's done, run this in a terminal window:

```bash
npm run dev
```

And then open the browser to [localhost:5173](http://localhost:5173) and you should see the completed app.

![Supabase Vue 3](/docs/img/supabase-vue-3-demo.png)

At this stage you have a fully functional application!
