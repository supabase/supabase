---
title: How to use Supabase with SWR?
author: roker15
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/59526869?v=4
author_url: https://github.com/roker15
answer: null
answered: false
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I see something like this 
`const { data, error } = useSWR(`/api/user/${id}`, fetcher)`
Then what will be the `fetcher` in case of super base?

I tried following but did not worked 
```

const fetcher = async () =>  await supabase.from("papers").select("*");

 const { data } = useSWR("/api/article", fetcher);
```
