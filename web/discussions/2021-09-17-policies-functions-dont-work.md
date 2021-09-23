---
title: Policies & Functions Don't work
author: Phamiliarize
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/10214230?u=35e6961929c10a1bf676dbe72d668c97a83e6e06&v=4
author_url: https://github.com/Phamiliarize
category: Q&A
upvoteCount: 1
commentCount: 3
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I want to only allow creation when a user has less than a certain amount of items.

I've created a custom function here to return a boolean based on this.

```sql
create function can_make_item(auth_user uuid)
returns boolean
language plpgsql
as
$$
declare
   retval boolean;
begin
   select CAST((count(*) < 4) as boolean)
   into retval
   from items
   where items.owner_id = auth_user;
   return retval;
end;
$$;
```

When dropping this into the following policy, however, it doesn't work and seems to always be true. It looks something like this

```sql
((role() = 'authenticated'::text) AND (can_make_board(uid()) = true))
```

I don't know why but policy auto changes `auth.uid()` to just `uid()`. I thought it might be because uid does not exist and it returns nothing therefore our count would always be less than 4. When running the function in a query with a string provided ID and not the uid() function this seems to be the case, so I added a check to make sure the user is also authenticated so that if they have a UID, and it has no items, then they should be clear.

The issue is, people can still unlimitedly make objects.


Am I doing something wrong? is this functionality just not supported?

If it is supported I think these functions can be a marvelous way to helping implement some business logic.



---

<a href="https://github.com/supabase/supabase/discussions/3235#discussioncomment-1361739" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/Phamiliarize" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/10214230?u=35e6961929c10a1bf676dbe72d668c97a83e6e06&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">Phamiliarize</span>
    <span style={{ color: '#8b949e' }}>2 days ago</span>
  </span>
  </a>
  </div>
  So I got this to work. I have two policies for creating items.

The first checks if you are in a "premium" table and does a TTL check on membership. IF that passes you can infinitely create.

The second starts with defining this function:

```

create or replace function get_free_slots(user_id uuid)
returns setof uuid as $$
   select
   owner_id
   from boards
   where owner_id = $1
   group by owner_id
   HAVING COUNT(*) < 4;

$$ stable language sql security definer;
```

Basically, you can put whatever number you want your limit to be, but make sure rather than returning true or false, you return a set with the user_id of those who are eligible. In this case our where also makes sure we only check for the user making the request. Next, the using portion of the insert policy is:

```
(uid() IN ( SELECT get_free_slots(uid()) AS get_free_slots))
```
Basically, the function won't add the user to the set if they aren't eligible, at which point our RLS will not allow the insert.
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
