---
title: Multiple relations between two tables?
author: budoteam
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/55960058?v=4
author_url: https://github.com/budoteam
answer: [object Object]
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I am currently developing a management tool for my sports school. Among other things, it will be used to plan courses.

Now I need the possibility to create multiple relations between two tables.

For example, I have a user table and one for the courses. In the courses the trainers are listed (can be several / linkd to the user table) as well as the participants (also from the user table). A separate trainer table is not an option, because they can also be participants in other lessons. Is there a possibility?

---
### Suggested answer
__dshukertjr__ `a day ago`

Hi @budoteam!

You could simply create two relational table like this:

```sql
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name varchar(18) not null unique
);

create table if not exists public.courses (
  id uuid not null primary key DEFAULT uuid_generate_v4 (),
  title varchar(18) not null
);

create type participant_type AS ENUM ('trainer', 'participant');

create table if not exists public.participants (
  user_id uuid references public.users not null,
  course_id uuid references public.courses not null,
  type participant_type not null,
  primary key (user_id, course_id)
);
```

You have a `participants` table that holds whoever is participating in certain course. A participant can either be a `trainer` or a `partifipant` in na given course. The same user can be the other role in different courses. 

