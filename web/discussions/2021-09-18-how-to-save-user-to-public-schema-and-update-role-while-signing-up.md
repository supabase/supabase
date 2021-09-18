---
title: How to save user to public schema and update role while signing up?
author: roker15
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/59526869?v=4
author_url: https://github.com/roker15
answer: null
answered: false
category: General
upvoteCount: 1
commentCount: 0
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Here is the previsous [discussion](https://github.com/supabase/supabase/discussions/458)  , answer has been marked accepted but whosoever is asked is not satisfied and answer is still pending since 8 -jan. so i have to ask this again
``
How to save user to public schema and update role while signing up? folloing is not working and user is undefined.
```
const { user, error } = await supabase.auth.signIn({ email });
      console.log(console.log(user)) //user is undefined here
const { data } = await supabase.from<Profile>("profiles").upsert({id:user?.id,role:role });
```
