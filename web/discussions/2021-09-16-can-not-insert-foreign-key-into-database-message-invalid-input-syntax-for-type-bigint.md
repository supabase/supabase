---
title: Can not insert foreign key into database? "message":"invalid input syntax for type bigint
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

I have multiple tables related by foreign keys reffering to tables `ID`, each table ID is of type `int8`
When i tried to do
```js
const { data, error } = await supabase
  .from<Post>("posts")
  .insert([{ "post": content, subheading_id: { id: 1 } }]
  
``` 

I am getting following response 

```
{"hint":null,"message":"invalid input syntax for type bigint: \"{\"id\":1}\"","code":"22P02","details":null}
```
