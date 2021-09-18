---
title: Inserting large amount of data
author: pearlslugs
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/61484145?u=e20364fd3facedce2762d88ce2b9d0ec3d930881&v=4
author_url: https://github.com/pearlslugs
answer: [object Object]
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I keep having my connection closed while trying to add a large amount of columns, is there any work around for this?

---
### Suggested answer
__steve-chavez__ `8 months ago`

**Edit**: `supabase-js/postgrest-js` now use the `columns` query parameter by default, no need to go to through the REST API for this.

@pearlslugs How are you adding the large amount of columns?

You could try inserting the big payload through the REST API. There's a special [columns query parameter](https://postgrest.org/en/v7.0.0/api.html#specifying-columns) that can help with large bulk inserts.

There are curl snippets in `https://app.supabase.io/project/<your_project_id>/api/default?resource=<your_table>`(click the API icon and then the Bash tab to go here).

