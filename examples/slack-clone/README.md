# Slack Clone

Deploy a simple slack clone using Supabase and Vercel.

<p align="center">
<kbd>
<img src="https://media.giphy.com/media/J07U8iblJhlKDqZOxV/giphy.gif" alt="Demo"/>
</kbd>
</p>


## How to use

Embed video.

**1. Create new project**

Sign up to Supabase - [https://app.supabase.io](https://app.supabase.io) and create a new project. Wait for your database to start.

**2. Run "Slack Clone" Quickstart**

Once your database has started, run the "Slack Clone" quickstart.

![Slack Clone Quick Start](https://user-images.githubusercontent.com/10214025/88916135-1b1d7a00-d298-11ea-82e7-e2c18314e805.png)

**3. Get the URL and Key**

Go to the Project Settings (the cog icon), and find your API URL and `anon` key.

![image](https://user-images.githubusercontent.com/10214025/88916245-528c2680-d298-11ea-8a71-708f93e1ce4f.png)

**4. Deploy the front end**

Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/git?s=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fslack-clone&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_KEY&envDescription=Find%20the%20Supabase%20URL%20and%20key%20in%20the%20your%20auto-generated%20docs%20at%20app.supabase.io&project-name=supabase-slack-clone&repo-name=supabase-slack-clone)

You will be asked for a `NEXT_PUBLIC_SUPABASE_URL` and `NENEXT_PUBLIC_SUPABASE_KEY`. You can use the keys in step 3.


## For developers

If you want to run this without deploying: 

**Clone this folder**

```sh
# Copy the repo to your machine
git clone --no-checkout https://github.com/supabase/supabase
cd supabase

# Checkout this 
git sparse-checkout init --cone
git sparse-checkout set examples/slack-clone-basic
cd examples/slack-clone-basic
```

**Start the frontend**

```sh
npm install     # install npm dependencies
npm run dev     # start Next.js
```

Visit http://localhost:3000 and start slacking! Open in two tabs to see everything getting updated in realtime
