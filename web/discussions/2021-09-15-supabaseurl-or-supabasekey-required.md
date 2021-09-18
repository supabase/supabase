---
title: supabaseUrl or supabaseKey required
author: CaseyG5
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/16518948?u=e70b396d1dc50cb82533e1e9540818c96de057fe&v=4
author_url: https://github.com/CaseyG5
answer: null
answered: false
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

1. `Error: supabaseUrl is required.`
2. `Error: supabaseKey is required.`

SupabaseClient.ts:
`   51 | this.storageUrl = `${supabaseUrl}/storage/v1`;`
`> 52 | this.schema = settings.schema;`

These two errors I'm getting in my React project (one at a time, not both together) are rather frustrating since my supabaseUrl and supabaseKey are, and have always been, provided to the `createClient()` function or `SupabaseClient()` constructor.  For the first error, Supabase complains about line 51 in it's own file.  For the second, line 52 is a problem.

I updated `@supabase/supabase-js` from version 1.22.5 to 1.22.6 and the URL error disappeared temporarily but then I switched to using my Service key instead of my Anon key and now the KEY error has taken its place.  Is this a Supabase bug that is plaguing anyone else?  Thanks for any tips you might have.

Casey
