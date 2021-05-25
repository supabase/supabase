---
id: faq
title: FAQs
description: 'Most frequently asked questions regarding Supabase'
---

### Have you built `[Firebase feature]` yet?

We're building as fast as we can! And we are even adding a few things that Firebase doesn't have, as we go. Here are the features we have built:

- A dashboard/UI for spinning up and managing your database in less than one minute.
- User authentication to sign up users and edit access rules on your database.
- Real-time database listeners.
- JavaScript library and APIs.
- Functions (kinda). These exist as database stored procedures, which can be written in SQL, JavaScript, Python, and Java.

### How can you be a Firebase alternative if you're built with a relational database?

We started Supabase because we love the functionality of Firebase, but we personally experienced the scaling issues that many others experienced. We chose Postgres because it's well-trusted and it has phenomenal scalability. Our goal is to make Postgres as easy to use as Firebase, so that you no longer have to choose between usability and scalability. Also, we're sure that once you start using Postgres, you'll love it more than any other database.

### How do I host Supabase?

Supabase is an amalgamation of five open source tools (and growing). Some of these tools are made by Supabase (like our [Realtime Server](https://github.com/supabase/realtime)), some we support indirectly (like [PostgREST](http://postgrest.org/en/v7.0.0/)), and some are third-party tools (like [Kong](https://github.com/Kong/kong)). All of the tools we use in Supabase are MIT, Apache 2.0, or PostgreSQL licensed. You can use the docker-compose script [here](https://github.com/supabase/supabase/tree/master/docker) to build Supabase on your own environment, and find detailed instructions [here](/docs/guides/self-hosting).

### Do you support `[some other database]`?

At the moment, we only support PostgreSQL. It's unlikely we'll ever move away from Postgres; however, you can [vote on a new database](https://github.com/supabase/supabase/issues/6) if you want us to start development.

### Do you have a library for `[some other language]`?

We currently have a JavaScript library. You can [vote on a new client library](https://github.com/supabase/supabase/issues/5) for your favorite language.
