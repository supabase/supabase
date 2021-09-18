---
title: Policies & Functions Don't work
author: Phamiliarize
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/10214230?u=35e6961929c10a1bf676dbe72d668c97a83e6e06&v=4
author_url: https://github.com/Phamiliarize
answer: null
answered: false
category: Q&A
upvoteCount: 1
commentCount: 1
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


