---
title: Row Level Security blocks all requests
author: dostuffthatmatters
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/29046316?u=bbbdd413a429b1775ade01b044d51908379859b2&v=4
author_url: https://github.com/dostuffthatmatters
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I am trying to allow certain users to insert stuff into a table. Since I do not want to share the project secret this should be based on email/password credentials.

The sign-in works fine and the `supabase.auth.user()` object immediately before the request is correct. The code I am using:

https://github.com/dostuffthatmatters/esm-air-quality-rt-plot-data/blob/4b923384854a85e2d6f317183f1f882455933199/run.py#L43-L61

I have tried any combination of RLS rules but comparisons with `role() = 'authenticated'` or `email() = '...'` always result in a blocked request. Has anyone here used Python and RLS before?
