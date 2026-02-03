---
title: 'Build a User Management App with Angular'
description: 'Learn how to use Supabase in your Angular App.'
---

<$Partial path="quickstart_intro.mdx" />

![Supabase User Management example](/docs/img/user-management-demo.png)

<Admonition type="note">

If you get stuck while working through this guide, refer to the [full example on GitHub](https://github.com/supabase/supabase/tree/master/examples/user-management/angular-user-management).

</Admonition>

<$Partial path="project_setup.mdx" variables={{ "framework": "ionicangular", "tab": "mobiles" }} />

## Building the app

Start with building the Angular app from scratch.

### Initialize an Angular app

You can use the [Angular CLI](https://angular.io/cli) to initialize an app called `supabase-angular`.
The command sets some defaults, that you change to suit your needs:

```bash
npx ng new supabase-angular --routing false --style css --standalone false --ssr false
cd supabase-angular
```

Then, install the only additional dependency: [supabase-js](https://github.com/supabase/supabase-js)

```bash
npm install @supabase/supabase-js
```

Finally, save the environment variables in a new `src/environments/environment.ts` file.
You need to create the `src/environments` directory first.
All you need are the API URL and the key that you copied [earlier](#get-api-details).
The application exposes these variables in the browser, and that's fine as you have [Row Level Security](/docs/guides/auth#row-level-security) enabled on the Database.

<$CodeSample
path="/user-management/angular-user-management/src/environments/environment.ts"
lines={[[1, -1]]}
meta="name=src/environments/environment.ts"
/>

With the API credentials in place, create a `SupabaseService` with `ng g s supabase` and add the following code to initialize the Supabase client and implement functions to communicate with the Supabase API.

This uses the [`getUser`](/docs/reference/javascript/auth-getuser) method to get the current user details if there is an existing session. This method performs a network request to the Supabase Auth server.

<$CodeSample
path="/user-management/angular-user-management/src/app/supabase.service.ts"
lines={[[1, -1]]}
meta="name=src/app/supabase.service.ts"
/>

Optionally, update `src/styles.css` to style the app. You can find the full contents of this file [in the example repository](https://github.com/supabase/supabase/tree/master/examples/user-management/angular-user-management/src/styles.css).

### Set up a login component

Next, set up an Angular component to manage logins and sign ups. The component uses [Magic Links](/docs/guides/auth/auth-email-passwordless#with-magic-link), so users can sign in with their email without using passwords.

Create an `AuthComponent` with the `ng g c auth` Angular CLI command and add the following code.

<$CodeTabs>

<$CodeSample
path="/user-management/angular-user-management/src/app/auth/auth.component.ts"
lines={[[1, -1]]}
meta="name=src/app/auth/auth.component.ts"
/>

<$CodeSample
path="/user-management/angular-user-management/src/app/auth/auth.component.html"
lines={[[1, -1]]}
meta="name=src/app/auth/auth.component.html"
/>

</$CodeTabs>

### Account page

Users also need a way to edit their profile details and manage their accounts after signing in.
Create an `AccountComponent` with the `ng g c account` Angular CLI command and add the following code.

<$CodeTabs>

<$CodeSample
path="/user-management/angular-user-management/src/app/account/account.component.ts"
lines={[[1, -1]]}
meta="name=src/app/account/account.component.ts"
/>

<$CodeSample
path="/user-management/angular-user-management/src/app/account/account.component.html"
lines={[[1, -1]]}
meta="name=src/app/account/account.component.html"
/>

</$CodeTabs>

## Profile photos

Every Supabase project is configured with [Storage](/docs/guides/storage) for managing large files like photos and videos.

### Create an upload widget

Create an avatar for the user so that they can upload a profile photo.
Create an `AvatarComponent` with `ng g c avatar` Angular CLI command and add the following code.

<$CodeTabs>

<$CodeSample
path="/user-management/angular-user-management/src/app/avatar/avatar.component.ts"
lines={[[1, -1]]}
meta="name=src/app/avatar/avatar.component.ts"
/>

<$CodeSample
path="/user-management/angular-user-management/src/app/avatar/avatar.component.html"
lines={[[1, -1]]}
meta="name=src/app/avatar/avatar.component.html"
/>

</$CodeTabs>

### Launch!

Now you have all the components in place, update `AppComponent`:

<$CodeTabs>

<$CodeSample
path="/user-management/angular-user-management/src/app/app.component.ts"
lines={[[1, -1]]}
meta="name=src/app/app.component.ts"
/>

<$CodeSample
path="/user-management/angular-user-management/src/app/app.component.html"
lines={[[1, -1]]}
meta="name=src/app/app.component.html"
/>

</$CodeTabs>

You also need to change `app.module.ts` to include the `ReactiveFormsModule` from the `@angular/forms` package.

<$CodeSample
path="/user-management/angular-user-management/src/app/app.module.ts"
lines={[[1, -1]]}
meta="name=src/app/app.module.ts"
/>

Once that's done, run the application in a terminal:

```bash
npm run start
```

Open the browser to [localhost:4200](http://localhost:4200) and you should see the completed app.

![Screenshot of the Supabase Angular application running in a browser](/docs/img/supabase-angular-demo.png)

At this stage you have a fully functional application!
