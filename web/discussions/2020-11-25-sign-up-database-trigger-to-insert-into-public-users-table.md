---
title: Sign-up database trigger to insert into public users table
author: skoshy
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/369825?u=26fdceebce232b0b9f062345775664103e18a4ad&v=4
author_url: https://github.com/skoshy
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi, I'm trying to set up a trigger to automatically copy new users from `auth` to my public `users` table. I've drafted up the below, but I get a database error every time I try to signup a new user (`"Database error saving new user"`). Any ideas on what could be the issue?

```sql
CREATE OR REPLACE FUNCTION auth.signup_copy_to_users_table()
RETURNS TRIGGER LANGUAGE plpgsql AS $function$
  BEGIN
    INSERT INTO public.users(id)
    VALUES(NEW.id);
  
    RETURN NEW;
  END;
$function$;

DROP TRIGGER IF EXISTS signup_copy on auth.users;
CREATE TRIGGER signup_copy
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE PROCEDURE signup_copy_to_users_table();
```

In general it'd be useful to be able to keep the auth/public users tables in sync with the `id` and `email` fields at least.
