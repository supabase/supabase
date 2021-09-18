---
title: Question about setting up fake users for dev
author: fergusmeiklejohn
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/11864025?u=aaf0a27a9e98b054fa9e72ffbe4e172bf46d6e8c&v=4
author_url: https://github.com/fergusmeiklejohn
answer: [object Object]
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I'm developing an app with lots of user interactions so many of the tables require a `user_id` column as a foreign key referencing `auth.users.id`.

eg I've got a comments thread, I've created 1000 fake comments, each comment must have a user_id which must reference a user id in `auth.users.id`.

Question 1: how do we generate ~1000 fake `auth.users`? What columns in `auth.users` must be populated?

Question 2: do all of the public tables need to reference the `auth.users` table? I've got a `public.users` table, which must reference `auth.users` but would I have the same level of data integrity if I referenced the `public.users.user_id` from all other pubic tables and only reference the `auth.users` table from the `public.users` table?  Seems to be me that it would be the same (and would be easier to manage in development) but I don't know..

---
### Suggested answer
__kangmingtay__ `2 days ago`

Hey @fergusmeiklejohn,

> how do we generate ~1000 fake auth.users? What columns in auth.users must be populated?

You can just do a bulk insert on the auth.users table and populate the `id` field with a randomly generated uuid since that's the primary key in the auth.users table, the `email` and the `email_confirmed_at` fields. If you want to add more user specific data for testing, you can always connect to postgres and take a look at the constraints on each table in the auth schema to figure out which fields should be populated.

> ...would I have the same level of data integrity if I referenced the public.users.user_id from all other pubic tables and only reference the auth.users table from the public.users table?

Yes, if you create a 1-1 relationship between the public.users and the auth.users on user_id, there shouldn't be issues with data integrity. In fact, I would recommend that you do that because the auth.users schema is maintained by Supabase and we make regular updates to it. If you directly modify the auth schema, it might result in breaking changes on your project when we roll out new auth updates. 


