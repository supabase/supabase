---
title: 'Build a User Management App with Ionic React'
description: 'Learn how to use Supabase in your Ionic React App.'
---

<$Partial path="quickstart_intro.mdx" />

![Supabase User Management example](/docs/img/ionic-demos/ionic-angular-account.png)

<Admonition type="note">

If you get stuck while working through this guide, refer to the [full example on GitHub](https://github.com/supabase/supabase/tree/master/examples/user-management/ionic-react-user-management).

</Admonition>

<$Partial path="project_setup.mdx" variables={{ "framework": "ionicreact", "tab": "mobiles" }} />

## Building the app

Start building the React app from scratch.

### Initialize an Ionic React app

Use the [Ionic CLI](https://ionicframework.com/docs/cli) to initialize
an app called `supabase-ionic-react`:

```bash
npm install -g @ionic/cli
ionic start supabase-ionic-react blank --type react
cd supabase-ionic-react
```

Install the only additional dependency: [supabase-js](https://github.com/supabase/supabase-js)

```bash
npm install @supabase/supabase-js
```

Save the environment variables in a `.env`. You need the API URL and the key that you copied [earlier](#get-api-details).

<$CodeTabs>

```bash name=.env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_KEY=YOUR_SUPABASE_KEY
```

</$CodeTabs>

With the API credentials in place, create a helper file to initialize the Supabase client. These variables will be exposed
in the browser, which is safe because they use a restricted publishable key and the SQL quickstart enables [Row Level Security](/docs/guides/auth#row-level-security) on the `profiles` table.

<$CodeSample
path="/user-management/ionic-react-user-management/src/supabaseClient.ts"
lines={[[1, -1]]}
meta="name=src/supabaseClient.ts"
/>

### Set up a login route

Set up a React component to manage logins and sign ups which uses Magic Links, so users can sign in with their email without using passwords.

<$CodeSample
path="/user-management/ionic-react-user-management/src/pages/Login.tsx"
lines={[[1, -1]]}
meta="name=src/pages/Login.tsx"
/>

### Account page

After a user signs in, they should be able to edit their profile details and manage their account.

Create a new component for that called `Account.tsx`.

<$CodeSample
path="/user-management/ionic-react-user-management/src/pages/Account.tsx"
lines={[[1, 15], [17, 124], [129, -1]]}
meta="name=src/pages/Account.tsx"
/>

### Launch!

Now that you have all the components in place, update `App.tsx`:

<$CodeSample
path="/user-management/ionic-react-user-management/src/App.tsx"
lines={[[1, -1]]}
meta="name=src/App.tsx"
/>

Once that's done, run this in a terminal window:

```bash
ionic serve
```

Then open your browser to the URL printed by `ionic serve` (by default, [http://localhost:8100](http://localhost:8100)) and you should see the completed app.

![Supabase Ionic React](/docs/img/ionic-demos/ionic-react.png)

## Bonus: Profile photos

Every Supabase project is configured with [Storage](/docs/guides/storage) for managing large files like photos and videos.

### Create an upload widget

First install two packages in order to interact with the user's camera.

```bash
npm install @ionic/pwa-elements @capacitor/camera
```

[Capacitor](https://capacitorjs.com) is a cross platform native runtime from Ionic that enables web apps to be deployed through the app store and provides access to native device API.

Ionic PWA elements is a companion package that will polyfill certain browser APIs that provide no user interface with custom Ionic UI.

With those packages installed update `index.tsx` to include an additional bootstrapping call for the Ionic PWA Elements.

<$CodeSample
path="/user-management/ionic-react-user-management/src/index.tsx"
lines={[[1, -1]]}
meta="name=src/index.tsx"
/>

Then create an `AvatarComponent`.

<$CodeSample
path="/user-management/ionic-react-user-management/src/components/Avatar.tsx"
lines={[[1, -1]]}
meta="name=src/components/Avatar.tsx"
/>

### Add the new widget

And then add the widget to the Account page:

<$CodeSample
path="/user-management/ionic-react-user-management/src/pages/Account.tsx"
lines={[[1, -1]]}
meta="name=src/pages/Account.tsx"
/>

At this stage you have a fully functional application!
