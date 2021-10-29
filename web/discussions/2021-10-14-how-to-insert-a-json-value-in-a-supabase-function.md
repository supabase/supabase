---
title: "How to insert a json value in a supabase function?"
author: KevTale
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/29467803?u=6cd64b671f04933500926935438f3e877a51ad70&v=4
author_url: https://github.com/KevTale
category: General
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi,

I've got this trigger with an associated function:


`

create function public.handle_new_submission()
returns trigger as $$
begin
  insert into public.submissions (id, contest_occurrence, winner)
  values (new.id, 1, ???);
  return new;
end;
$$ language plpgsql security definer;


create trigger on_submission_inserted
  after insert on public.submissions
  for each row execute procedure public.handle_new_submission();

`

I want `winner` (currently the " ??? ") value to looks like this:


`
{
  is_winner: false,
  contest_occurrence: 1,
 }

`

But I have no idea how to write this and not sure how to effectively google it...

Can someone help?

Thanks!

---

<a href="https://github.com/supabase/supabase/discussions/3524#discussioncomment-1477866" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/burggraf" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/225717?v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">burggraf</span>
    <span style={{ color: '#8b949e' }}>15 days ago</span>
  </span>
  </a>
  </div>
  Look into using `JSON` (or better yet `JSONB`) with PostgreSQL.
https://supabase.io/docs/guides/database/json

For your example:

```sql
insert into public.submissions (id, contest_occurrence, winner) 
values (new.id, 1, ???);
```

you could probably just do:
```sql
insert into public.submissions (id, contest_occurrence, winner)
  values (new.id, 1, '{is_winner: false, contest_occurrence: 1}');
```

  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
