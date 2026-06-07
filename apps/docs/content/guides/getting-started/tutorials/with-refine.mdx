---
title: 'Build a User Management App with Refine'
description: 'Learn how to use Supabase in your Refine App.'
---

<$Partial path="quickstart_intro.mdx" />

![Supabase User Management example](/docs/img/user-management-demo.png)

<Admonition type="note">

If you get stuck while working through this guide, you can find the [full example on GitHub](https://github.com/supabase/supabase/tree/master/examples/user-management/refine-user-management).

</Admonition>

## About Refine

[Refine](https://github.com/refinedev/refine) is a React-based framework used to rapidly build data-heavy applications like admin panels, dashboards, storefronts and any type of CRUD apps. It separates app concerns into individual layers, each backed by a React context and respective provider object. For example, the auth layer represents a context served by a specific set of [`authProvider`](https://refine.dev/docs/tutorial/understanding-authprovider/index/) methods that carry out authentication and authorization actions such as logging in, logging out, getting roles data, etc. Similarly, the data layer offers another level of abstraction equipped with [`dataProvider`](https://refine.dev/docs/tutorial/understanding-dataprovider/index/) methods to handle CRUD operations at appropriate backend API endpoints.

Refine provides hassle-free integration with a Supabase backend with its supplementary [`@refinedev/supabase`](https://github.com/refinedev/refine/tree/main/packages/supabase) package. It generates `authProvider` and `dataProvider` methods at project initialization, so you don't need to spend much effort defining them yourself, choose Supabase as the backend service while creating the app with `create refine-app`.

<$Partial path="project_setup.mdx" variables={{ "framework": "refine", "tab": "frameworks" }} />

## Building the app

Start building the Refine app from scratch.

### Initialize a Refine app

Use [create refine-app](https://refine.dev/docs/tutorial/getting-started/headless/create-project/#launch-the-refine-cli-setup) command to initialize
an app. Run the following in the terminal:

```bash
npm create refine-app@latest -- --preset refine-supabase
```

The command above uses the `refine-supabase` preset which chooses the Supabase supplementary package for the app. There's no UI framework, so the app has a headless UI with plain React and CSS styling.

The `refine-supabase` preset installs the `@refinedev/supabase` package which out-of-the-box includes the Supabase dependency: [supabase-js](https://github.com/supabase/supabase-js).

Install the `@refinedev/react-hook-form` and `react-hook-form` packages that to use [React Hook Form](https://react-hook-form.com) inside Refine apps. Run:

```bash
npm install @refinedev/react-hook-form react-hook-form
```

### Refine `supabaseClient`

The `create refine-app` generated a Supabase client in the `src/utility/supabaseClient.ts` file. It has two constants: `SUPABASE_URL` and `SUPABASE_KEY`. Replace them as `supabaseUrl` and `supabasePublishableKey` respectively and assign them your Supabase server's values.

Update it with environment variables managed by Vite:

<$CodeSample
path="/user-management/refine-user-management/src/utility/supabaseClient.ts"
lines={[[1, -1]]}
meta="name=src/utility/supabaseClient.ts"
/>

Save the environment variables in a `.env.local` file. All you need are the API URL and the key that you copied [earlier](#get-api-details).

```bash .env.local
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The `supabaseClient` fetches calls to Supabase endpoints from the app. The client is instrumental in implementing authentication using Refine's auth provider methods and CRUD actions with appropriate data provider methods.

### App styling (optional)

An optional step is to update the CSS file `src/App.css` to make the app look better.
You can find the full contents of this file [in the example repository](https://raw.githubusercontent.com/supabase/supabase/master/examples/user-management/refine-user-management/src/App.css).

### The `<Refine />` component

In order to add login and user profile pages in this App, tweak the `<Refine />` component inside `App.tsx`.

The `App.tsx` file initially looks like this:

<$CodeTabs>

```tsx name=src/App.tsx
import { Refine, WelcomePage } from '@refinedev/core'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from '@refinedev/react-router'
import { dataProvider, liveProvider } from '@refinedev/supabase'
import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import authProvider from './authProvider'
import { supabaseClient } from './utility'

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <Refine
          dataProvider={dataProvider(supabaseClient)}
          liveProvider={liveProvider(supabaseClient)}
          authProvider={authProvider}
          routerProvider={routerProvider}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <Routes>
            <Route index element={<WelcomePage />} />
          </Routes>
          <RefineKbar />
          <UnsavedChangesNotifier />
          <DocumentTitleHandler />
        </Refine>
      </RefineKbarProvider>
    </BrowserRouter>
  )
}

export default App
```

</$CodeTabs>

Focus on the [`<Refine />`](https://refine.dev/docs/api-reference/core/components/refine-config/) component, which comes with props passed to it. Notice the `dataProvider` prop. It uses a `dataProvider()` function with `supabaseClient` passed as argument to generate the data provider object. The `authProvider` object also uses `supabaseClient` in implementing its methods. You can look it up in `src/authProvider.ts` file.

### Customize `authProvider`

If you examine the `authProvider` object you can notice that it has a `login` method that implements an OAuth and Email / Password strategy for authentication. This tutorial instead removes them and use Magic Links to allow users sign in with their email without using passwords.

Use `supabaseClient` auth's `signInWithOtp` method inside `authProvider.login` method:

```ts name=src/authProvider.ts
login: async ({ email }) => {
  try {
    const { error } = await supabaseClient.auth.signInWithOtp({ email });

    if (!error) {
      alert("Check your email for the login link!");
      return {
        success: true,
      };
    };

    throw error;
  } catch (e: any) {
    alert(e.message);
    return {
      success: false,
      e,
    };
  }
},
```

Remove `register`, `updatePassword`, `forgotPassword` and `getPermissions` properties, which are optional type members and also not necessary for the app. The final `authProvider` object looks like this:

<$CodeSample
path="/user-management/refine-user-management/src/authProvider.ts"
lines={[[1, -1]]}
meta="name=src/authProvider.ts"
/>

### Set up a login component

As the app uses the headless Refine core package that comes with no supported UI framework set up a plain React component to manage logins and sign ups.

Create and edit `src/components/auth.tsx`:

<$CodeSample
path="/user-management/refine-user-management/src/components/auth.tsx"
lines={[[1, -1]]}
meta="name=src/components/auth.tsx"
/>

The [`useLogin()`](https://refine.dev/docs/api-reference/core/hooks/authentication/useLogin/) Refine auth hook to grab the `mutate: login` method to use inside `handleLogin()` function and `isLoading` state for the form submission. The `useLogin()` hook conveniently offers access to `authProvider.login` method for authenticating the user with OTP.

### Account page

After a user is signed in, allow them to edit their profile details and manage their account.

Create a new component for that in `src/components/account.tsx`.

<$CodeSample
path="/user-management/refine-user-management/src/components/account.tsx"
lines={[[1, 3], [8, 43], [69, -1]]}
meta="name=src/components/account.tsx"
/>

This uses three Refine hooks, namely the [`useGetIdentity()`](https://refine.dev/docs/api-reference/core/hooks/authentication/useGetIdentity/), [`useLogOut()`](https://refine.dev/docs/api-reference/core/hooks/authentication/useLogout/) and [`useForm()`](https://refine.dev/docs/packages/documentation/react-hook-form/useForm/) hooks.

`useGetIdentity()` is a auth hook that gets the identity of the authenticated user. It grabs the current user by invoking the `authProvider.getIdentity` method under the hood.

`useLogOut()` is also an auth hook. It calls the `authProvider.logout` method to end the session.

`useForm()`, in contrast, is a data hook that exposes a series of useful objects that serve the edit form. For example, grabbing the `onFinish` function to submit the form with the `handleSubmit` event handler. It also uses `formLoading` property to present state changes of the submitted form.

The `useForm()` hook is a higher-level hook built on top of Refine's `useForm()` core hook. It fully supports form state management, field validation and submission using React Hook Form. Behind the scenes, it invokes the `dataProvider.getOne` method to get the user profile data from the Supabase `/profiles` endpoint and also invokes `dataProvider.update` method when `onFinish()` is called.

## Profile photos

Next, add a way for users to upload a profile photo. Supabase configures every project with [Storage](/docs/guides/storage) for managing large files like photos and videos.

### Create an upload widget

Add a new component:

Create and edit `src/components/avatar.tsx`:

<$CodeSample
path="/user-management/refine-user-management/src/components/avatar.tsx"
lines={[[1, -1]]}
meta="name=src/components/avatar.tsx"
/>

### Update the Account component

With the Avatar component created, update `src/components/account.tsx` to include it:

<$CodeSample
path="/user-management/refine-user-management/src/components/account.tsx"
lines={[[1, -1]]}
meta="name=src/components/account.tsx"
/>

### Launch!

With all the components in place, define the routes for the pages in which they should be rendered.

Add the routes for `/login` with the `<Auth />` component and the routes for `index` path with the `<Account />` component. So, the final `App.tsx`:

<$CodeSample
path="/user-management/refine-user-management/src/App.tsx"
lines={[[1, -1]]}
meta="name=src/App.tsx"
/>

Test the App by running the server again:

```bash
npm run dev
```

And then open the browser to [localhost:5173](http://localhost:5173) and you should see the completed app.

![Supabase Refine](/docs/img/supabase-refine-demo.png)

At this stage, you have a fully functional application!
