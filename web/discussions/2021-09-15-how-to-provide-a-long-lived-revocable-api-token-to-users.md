---
title: How to provide a long-lived, revocable API token to users?
author: grschafer
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/694225?v=4
author_url: https://github.com/grschafer
answer: [object Object]
answered: true
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I'm currently hosting and using PostgREST on its own and I'm thinking about moving to Supabase. I'm trying to figure out how to fit the following workflow into Supabase:

> I'd like to provide a long-lived API token (JWT) for each user of my webapp. Users would use this token in their own CLI tools and scripts to auth access to my API. So, the token would be similar in usage to e.g. Stripe API tokens or AWS credentials or the Supabase `service_role` token. Given that the token would be long-lived, I want to let the user revoke it and mint a new one on a user-settings page in my webapp.

The [suggested way to do this with PostgREST](https://postgrest.org/en/v8.0/tutorials/tut1.html#bonus-topic-immediate-revocation) is to add a `pre-request` function that can verify the token (e.g. require a "revocation id" custom claim in the JWT, which gets looked up in the database to see if the token has been revoked or not). Using the `pre-request` approach came up in a recent discussion about rotating the `service_role` key (https://github.com/supabase/supabase/discussions/2265#discussioncomment-1230872). Is adding the `pre-request` config option to the Supabase Admin UI on the roadmap? Should a feature-request issue be created for it?

I suppose an alternative approach might be to add a policy to every table which calls a verify-token function which raises an exception if the JWT is revoked. This feels non-DRY and a bit error-prone though, and I'm not sure how much it might impact performance (maybe it's not too bad if the verify-token function is [marked as stable](https://www.postgresql.org/docs/current/xfunc-volatility.html)?). I'm curious if anyone else here has considered how to handle this situation and found a nicer solution that I'm missing, or if waiting for `pre-request` in Supabase is the best case.

Thanks!
