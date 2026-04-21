---
title: 'Build a User Management App with Ionic Angular'
description: 'Learn how to use Supabase in your Ionic Angular App.'
---

<$Partial path="quickstart_intro.mdx" />

![Supabase User Management example](/docs/img/ionic-demos/ionic-angular-account.png)

<Admonition type="note">

If you get stuck while working through this guide, refer to the [full example on GitHub](https://github.com/supabase/supabase/tree/master/examples/user-management/ionic-angular-user-management).

</Admonition>

<$Partial
path="project_setup.mdx"
variables={{ "framework": "ionicangular", "tab": "mobiles" }}
/>

## Building the app

Start building the Angular app from scratch.

### Initialize an Ionic Angular app

Use the [Ionic CLI](https://ionicframework.com/docs/cli) to initialize
an app called `supabase-ionic-angular`:

```bash
npm install -g @ionic/cli
ionic start supabase-ionic-angular blank --type angular
cd supabase-ionic-angular
```

Install the only additional dependency: [supabase-js](https://github.com/supabase/supabase-js)

```bash
npm install @supabase/supabase-js
```

And finally, save the environment variables in the `src/environments/environment.ts` file.
All you need are the API URL and the key that you copied [earlier](#get-api-details).
These variables will be exposed on the browser, and that's fine as [Row Level Security](/docs/guides/auth#row-level-security) is enabled on the Database.

<$CodeSample
path="/user-management/ionic-angular-user-management/src/environments/environment.ts"
lines={[[1, -1]]}
meta="name=src/environments/environment.ts"
/>

Now that you have the API credentials in place, create a `SupabaseService` with `ionic g s supabase` to initialize the Supabase client and implement functions to communicate with the Supabase API.

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/supabase.service.ts"
lines={[[1, -1]]}
meta="name=src/app/supabase.service.ts"
/>

### Set up a login route

Set up a route to manage logins and signups. Use Magic Links so users can sign in with their email without using passwords.
Create a `LoginPage` with the `ionic g page login` Ionic CLI command.

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/login/login.page.ts"
lines={[[1, -1]]}
meta="name=src/app/login/login.page.ts"
/>

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/login/login.page.html"
lines={[[1, -1]]}
meta="name=src/app/login/login.page.html"
/>

### Account page

After a user is signed in, allow them to edit their profile details and manage their account.
Create an `AccountComponent` with `ionic g page account` Ionic CLI command.

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/account/account.page.ts"
lines={[[1, -1]]}
meta="name=src/app/account/account.page.ts"
/>

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/account/account.page.html"
lines={[[1, -1]]}
meta="name=src/app/account/account.page.html"
/>

### Launch!

Now that you have all the components in place, update `AppComponent`:

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/app.component.ts"
lines={[[1, -1]]}
meta="name=src/app/app.component.ts"
/>

Then update the `AppRoutingModule`

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/app-routing.module.ts"
lines={[[1, -1]]}
meta="name=src/app/app-routing.module.ts"
/>

Once that's done, run this in a terminal window:

```bash
ionic serve
```

And the browser automatically opens to show the app.

![Supabase Angular](/docs/img/ionic-demos/ionic-angular.png)

## Bonus: Profile photos

Every Supabase project is configured with [Storage](/docs/guides/storage) for managing large files like photos and videos.

### Create an upload widget

Let's create an avatar for the user so that they can upload a profile photo.

First, install two packages in order to interact with the user's camera.

```bash
npm install @ionic/pwa-elements @capacitor/camera
```

[Capacitor](https://capacitorjs.com) is a cross-platform native runtime from Ionic that enables web apps to be deployed through the app store and provides access to native device API.

Ionic PWA elements is a companion package that polyfills certain browser APIs that provide no user interface with custom Ionic UI.

With those packages installed, update `main.ts` to include an additional bootstrapping call for the Ionic PWA Elements.

<$CodeSample
path="/user-management/ionic-angular-user-management/src/main.ts"
lines={[[1, -1]]}
meta="name=src/main.ts"
/>

Then create an `AvatarComponent` with this Ionic CLI command:

```bash
ionic g component avatar --module=/src/app/account/account.module.ts --create-module
```

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/avatar/avatar.component.ts"
lines={[[1, -1]]}
meta="name=src/app/avatar/avatar.component.ts"
/>

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/avatar/avatar.component.html"
lines={[[1, -1]]}
meta="name=src/app/avatar/avatar.component.html"
/>

<$CodeSample
path="/user-management/ionic-angular-user-management/src/app/avatar/avatar.component.scss"
lines={[[1, -1]]}
meta="name=src/app/avatar/avatar.component.scss"
/>

At this stage, you have a fully functional application!

## See also

- [Authentication in Ionic Angular with Supabase](/blog/authentication-in-ionic-angular)
