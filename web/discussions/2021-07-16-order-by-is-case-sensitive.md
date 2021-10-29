---
title: "Order by is case sensitive"
author: rakeshkhoodeeram
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/3471148?v=4
author_url: https://github.com/rakeshkhoodeeram
category: General
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

When I call https://xhabqccfdobmicajnvqx.supabase.co/rest/v1/s_users_lists?order=name
I had items being  fetched in order as: Ration, dwdwd, njn, which is not correct as it had to be: dwdwd, njn, Ration.
When I changed them to upper case, then I got, DWDWD, NJN, RATION.

---

<a href="https://github.com/supabase/supabase/discussions/2402#discussioncomment-1023391" className="margin-bottom--md">Open on GitHub</a>

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
    <span style={{ color: '#8b949e' }}>3 months ago</span>
  </span>
  </a>
  </div>
  To override the default behavior, you can lowercase the names by using a [computed column](https://postgrest.org/en/stable/api.html#computed-columns). Like:

```sql
create function lower_name(s_users_lists s) returns text as $$
  select lower(s.name);
$$ language sql;
```

Then doing:

```
/rest/v1/s_users_lists?order=lower_name
```

Should work as you expect.
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
