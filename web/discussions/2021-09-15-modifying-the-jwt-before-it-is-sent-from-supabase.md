---
title: Modifying the JWT before it is sent from supabase
author: sanketch
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/1075218?v=4
author_url: https://github.com/sanketch
answer: [object Object]
category: Q&A
upvoteCount: 2
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hey! Is there a way to modify the JWT somehow before it is returned to the user? We want to use CubeJS's multi-tenancy feature, and in order to do that we need to pass in the CubeJS's security context in the token. 

One solution is to send over the supabase token to a backend service that then creates another token with CubeJS. This token is then stored in client local storage. But trying to see if there is an approach where we can modify it before the auth token is sent from supabase to save another trip. Any thoughts?

https://cube.dev/docs/security

---
### Suggested answer
__kangmingtay__ `2 days ago`

Hey @sanketch, we expose the `JWT_SECRET` on the dashboard under the "Settings" -> "API" page. You can use that `JWT_SECRET` to sign it after updating the JWT payload. However, do note that this should be done on the backend / server-side instead of on the client because the `JWT_SECRET` should not be exposed.

