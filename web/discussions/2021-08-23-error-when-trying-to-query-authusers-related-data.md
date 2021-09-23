---
title: Error when trying to query `auth.users` related data
author: mcewen87
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/23143729?u=8d3bb6a23cfaef18cc6245727a34f6b63755ebb6&v=4
author_url: https://github.com/mcewen87
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

# Bug report

## Describe the bug

When trying to make a select query using the Supabase client that joins a related table, I'm receiving the following error: 
"Could not find a relationship between posts and users in the schema cache"

## To Reproduce

Steps to reproduce the behavior, please provide code snippets or a repository:

1. Create a posts table with a fk constraint 'user_id' on the auth.users table.
2. Attempt to query all posts by user id and join the email field from auth.users as such


```
  const { data, error } = await supabase
      .from("posts")
      .select(
        `id,
        title,
        description,
        users (
          email
        )
        `
      )
      .eq("user_id", user.id);

```
This throws an error: "Could not find a relationship between posts and users in the schema cache"

## Expected behavior

I expect email to return from the auth.users table. 

## Additional context

In the Supabase dashboard, I can see a fk relationship exists on the posts table for user_id, I can also see the constraint listed from pg_constraints. 
![Screen Shot 2021-08-22 at 8 47 26 PM](https://user-images.githubusercontent.com/23143729/130379232-ddeeb259-3e03-4e18-b0d8-009f7808bb6a.png)
![Screen Shot 2021-08-22 at 8 46 57 PM](https://user-images.githubusercontent.com/23143729/130379245-69b9ee90-272e-4e33-9d9d-6aabb0de8000.png)





---

<a href="https://github.com/supabase/supabase/discussions/2947#discussioncomment-1231027" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/steve-chavez" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/1829294?u=8ad4fe0b6485e806601d2c2128fa37f536205034&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">steve-chavez</span>
    <span style={{ color: '#8b949e' }}>a month ago</span>
  </span>
  </a>
  </div>
  > Create a posts table with a fk constraint 'user_id' on the auth.users table.

**Edit**: Make sure to create the adequate GRANT and RLS POLICY on auth.users when exposing it in a view like this

The `auth.users` table is part of the `auth` schema and the `supabase-js` library only works on objects inside the `public` schema.

What you could do is to create a view of `auth.users` on the `public` schema:

```sql
create view users as select id, email from auth.users;
-- IMPORTANT: only expose a subset of auth.users columns in the view, it has things like encrypted_password, which should never be public
```

Then querying related data should work:

```js
  const { data, error } = await supabase
      .from("posts")
      .select(
        `id,
        title,
        description,
        users (
          email
        )
        `
      )
      .eq("user_id", user.id);
```
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
