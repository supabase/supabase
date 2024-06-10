# Realtime chat example using Supabase

This is a full-stack Slack clone example using:

- Frontend:
  - Next.js.
  - [Supabase.js](https://supabase.com/docs/library/getting-started) for user management and realtime data syncing.
- Backend:
  - [supabase.com/dashboard](https://supabase.com/dashboard/): hosted Postgres database with restful API for usage with Supabase.js.

## Demo

- CodeSandbox: https://codesandbox.io/s/github/supabase/supabase/tree/master/examples/nextjs-slack-clone

![Demo animation gif](./public/slack-clone-demo.gif)

## Deploy your own

### 1. Create new project

Sign up to Supabase - [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Wait for your database to start.

### 2. Run "Slack Clone" Quickstart

Once your database has started, run the "Slack Clone" quickstart.

![Slack Clone Quick Start](https://user-images.githubusercontent.com/1811651/101558751-73fecc80-3974-11eb-80be-423fa2789877.png)

### 3. Get the URL and Key

Go to the Project Settings (the cog icon), open the API tab, and find your API URL and `anon` key. You'll need these in the next step.

The `anon` key is your client-side API key. It allows "anonymous access" to your database, until the user has logged in. Once they have logged in, the keys will switch to the user's own login token. This enables row level security for your data. Read more about this [below](#postgres-row-level-security).

![image](https://user-images.githubusercontent.com/10214025/88916245-528c2680-d298-11ea-8a71-708f93e1ce4f.png)

**_NOTE_**: The `service_role` key has full access to your data, bypassing any security policies. These keys have to be kept secret and are meant to be used in server environments and never on a client or browser.

### 4. Deploy the Next.js client

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fslack-clone%2Fnextjs-slack-clone&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Find%20the%20Supabase%20URL%20and%20key%20in%20the%20your%20auto-generated%20docs%20at%20supabase.com/dashboard&project-name=supabase-slack-clone&repo-name=supabase-slack-clone)

Here, we recommend forking this repo so you can deploy through Vercel by clicking the button above. When you click the button, replace the repo URL with your fork's URL.

You will be asked for a `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the API URL and `anon` key from [step 3](#3-get-the-url-and-key).

### 5. Change authentication settings if necessary

![Change auth settings](https://user-images.githubusercontent.com/1811651/101840012-39be3800-3af8-11eb-8c32-73f2fae6299e.png)

On [supabase.com/dashboard](https://supabase.com/dashboard), you can go to Authentication -> Settings to change your auth settings for your project if necessary. Here, you can change the site URL, which is used for determining where to redirect users after they confirm their email addresses or attempt to use a magic link to log in.

Here, you can also enable external oauth providers, such as Google and GitHub.

## How to use

### Using this repo

Simply clone this repo locally and proceed to the next section.

### Required configuration

Copy the `.env.example` file into a file named `.env.local` in the root directory of the example:

```bash
cp .env.example .env.local
```

Set your Supabase details from [step 3](#3-get-the-url-and-key) above:

```bash
NEXT_PUBLIC_SUPABASE_URL=<replace-with-your-API-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<replace-with-your-anon-key>
```

### Change authentication settings if necessary

Follow [Step #5](#5-change-authentication-settings-if-necessary) above if you want to change the auth settings.

### Run the development server

Now install the dependencies and start the development server.

```bash
npm install
npm run dev
# or
yarn
yarn dev
```

Visit http://localhost:3000 and start chatting! Open a channel across two browser tabs to see everything getting updated in realtime 🥳

## Supabase details

### Role-based access control (RBAC)

Use [plus addressing](https://en.wikipedia.org/wiki/Email_address#Subaddressing) to sign up users with the `admin` & `moderator` roles. Email addresses including `+supaadmin@` will be assigned the `admin` role, and email addresses including `+supamod@` will be assigned the `moderator` role. For example:

```
// admin user
email+supaadmin@example.com

// moderator user
email+supamod@example.com
```

Users with the `moderator` role can delete all messages. Users with the `admin` role can delete all messages and channels (note: it's not recommended to delete the `public` channel).

### Postgres Row level security

This project uses very high-level Authorization using Postgres' Row Level Security.
When you start a Postgres database on Supabase, we populate it with an `auth` schema, and some helper functions.
When a user logs in, they are issued a JWT with the role `authenticated` and their UUID.
We can use these details to provide fine-grained control over what each user can and cannot do.

- For the full schema refer to [full-schema.sql](./full-schema.sql).
- For documentation on Role-based Access Control, refer to the [docs](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac).

## Authors

- [Supabase](https://supabase.com)

Supabase is open source, we'd love for you to follow along and get involved at https://github.com/supabase/supabase
