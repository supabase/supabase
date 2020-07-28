# Basic Slack Clone

Build a simple slack clone using Supabase, Postgres and React hooks.

<p align="center">
<kbd>
<img src="https://media.giphy.com/media/J07U8iblJhlKDqZOxV/giphy.gif" alt="Demo"/>
</kbd>
<br />
<a href="https://media.giphy.com/media/J07U8iblJhlKDqZOxV/source.gif">View full image</a>
</p>


## How to use

**Clone the this folder**

```sh
# Copy the repo to your machine
git clone --no-checkout https://github.com/supabase/supabase
cd supabase

# Checkout this 
git sparse-checkout init --cone
git sparse-checkout set examples/slack-clone-basic
cd examples/slack-clone-basic
```

**Install dependencies**

```sh
npm install 
```

**Start the backend**

```sh
# Open a terminal and run:
docker-compose up
```

**Start the frontent**

```sh
# Open a terminal and run:
npm run dev
```

Visit http://localhost:3000 and start slacking! Open in two tabs to see everything getting updated in realtime
