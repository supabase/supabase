---
title: I have three user role author, editor and publisher .. how to do this in supabase. earlier disucssion did not help me.
author: roker15
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/59526869?v=4
author_url: https://github.com/roker15
answer: [object Object]
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I have three user role **author, editor and publishe**r .. how to do this in supabase. earlier disucssion did not help me. auth.user has role **authenticated** only.

---
### Suggested answer
__awalias__ `2 days ago`

hey @roker15 thanks for the question but please refrain from spamming the discussion board, if useful you can refer to the answers on your previous question here: https://github.com/supabase/supabase/discussions/3129

you can implement this at the schema level as per the example linked, but our API gateway does not yet currently support custom "postgres level roles", this is being worked on and should be available in the coming months

