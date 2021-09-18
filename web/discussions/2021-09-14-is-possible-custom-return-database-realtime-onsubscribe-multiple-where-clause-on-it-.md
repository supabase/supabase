---
title: Is possible custom return Database Realtime onSubscribe & multiple where clause on it ?
author: zgramming
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/38829404?u=205777e46c675f088ecad68aee2005eace313de1&v=4
author_url: https://github.com/zgramming
answer: [object Object]
answered: true
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I'm confused whether this should be a separate question or not, but I have 2 questions regarding Realtime Database, and i integrated **Supabase** with **Flutter**

In this [docs](https://supabase.io/docs/reference/javascript/subscribe) about Realtime Database, it is very clear that we can listen for any changes in our table by defining table and action what we want listen (Insert,Update,Delete). And even better, we can listen [to row level change](https://supabase.io/docs/reference/javascript/subscribe#listening-to-row-level-changes).

But i have some special cases which have not been explained in the documentation, let me explain this.


## Table Profile
<table>
<thead>
<tr>
<th>id</th>
<th>id_user</th>
<th>name</th>
<th>email</th>
<th>picture_profile</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>55c0aa7c-d479-41b9-b06a-470c13f35bc1</td>
<td>Zeffry Reynando</td>
<td>zeffry.reynando@gmail.com</td>
<td>https://example.com/image.png</td>
</tr>
<tr>
<td>2</td>
<td>58a3eebf-98c1-46e3-8603-08c266676f43</td>
<td>Icha</td>
<td>icha@gmail.com</td>
<td>https://example.com/image2.png</td>
</tr>
</tbody>
</table>

## Table Inbox
<table>
<thead>
<tr>
<th>id</th>
<th>inbox_channel</th>
<th>id_user</th>
<th>id_sender</th>
<th>message</th>
<th>message_date</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>1_2</td>
<td>1</td>
<td>1</td>
<td>Halo ?</td>
<td>111122223333</td>
</tr>
<tr>
<td>2</td>
<td>1_2</td>
<td>2</td>
<td>1</td>
<td>Halo ?</td>
<td>111122223333</td>
</tr>

</tbody>
</table>

> I have made an example table above, to make it easier to explain what I mean.

# 1. Custom return onSubscribe

```
const mySubscription = supabase
  .from('inbox')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

When there is a change in the our table (UPDATE,INSERT,DELETE), `onSubscribe` give us return **object**. If we use the example table above, when table **inbox** there is data change `onSubscribe` will give us : 

```
{
 "id": "2",
 "inbox_channel" : "1_2",
 "id_user" : "1",
 "id_sender" : "2",
 "message" : "halooo",
 "message_date" : 1112223333
}
```
Is possible we can custom return callback like this  ? : 

```
 "id": "2",
 "inbox_channel" : "1_2",
 /// It from profile table
 "user" : {
        "id" : "1",
        "id_user" : "55c0aa7c-d479-41b9-b06a-470c13f35bc1",
        "name" : "zeffry",
        "email" : "zeffry.reynando@gmail.com",
        "picture_profile" : "https://example.com/image1.png",
 }
 
 "sender" : {
        "id" : "2",
        "id_user" : "58a3eebf-98c1-46e3-8603-08c266676f43",
        "name" : "icha",
        "email" : "icha@gmail.com",
        "picture_profile" : "https://example.com/image2.png",
 }
 "message" : "halooo",
 "message_date" : 1112223333
}
```
If we use standar select, it's can be achieve using [JOIN](https://supabase.io/docs/reference/javascript/select#query-foreign-tables).

```
supabase.from("inbox")
        .select("*, user:id_user(*), sender:id_sender(*)")
        .eq('id_user', idUser)
        .execute();
```

But i don't know implement it when using `onSubscribe`.



# 2. Multiple Where clause onSubscribe

As I explained above, we can listen to changes down [to row level change](https://supabase.io/docs/reference/javascript/subscribe#listening-to-row-level-changes). In documentation, as far as I understand it is only described using 1 filter. 

```
const mySubscription = supabase
  .from('countries:id=eq.200')
  .on('UPDATE', handleRecordUpdated)
  .subscribe()
```

It's possible use multiple where clause on `onSubscribe` ?  something like this

```
const mySubscription = supabase
  .from('countries:id=eq.200, countries:id_user=eq.100')
  .on('UPDATE', handleRecordUpdated)
  .subscribe()
```

Thank's.
