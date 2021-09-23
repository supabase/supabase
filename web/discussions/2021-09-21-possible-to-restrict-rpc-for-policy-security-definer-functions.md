---
title: Possible to restrict rpc for policy security definer functions?
author: AJamesPhillips
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/526509?v=4
author_url: https://github.com/AJamesPhillips
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

In the [docs for auth](https://supabase.io/docs/guides/auth#policies-with-security-definer-functions) to solve RLS for many-to-many relationships it gives an example of using a function created with `security definer` privileges.

```sql
create or replace function get_teams_for_user(user_id uuid)
returns setof bigint as $$
    select team_id
    from members
    where user_id = $1
$$ stable language sql security definer;
```

However this is callable from the client via rpc which reveals what teams (team ids) someone is a member of.  Is there a way to keep this information private?


---

<a href="https://github.com/supabase/supabase/discussions/3269#discussioncomment-1361503" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/AJamesPhillips" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/526509?v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">AJamesPhillips</span>
    <span style={{ color: '#8b949e' }}>2 days ago</span>
  </span>
  </a>
  </div>
  Actually it looks like it's [possible to rewrite this function](https://stackoverflow.com/a/69267166/539490) as:

```sql
create or replace function get_teams_for_user()
returns setof bigint as $$
    select team_id
    from members
    where user_id = auth.uid()
$$ stable language sql security definer;
```

Which then prevents other users from finding the teams other users are members of.  Is there a downside to this approach?
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
