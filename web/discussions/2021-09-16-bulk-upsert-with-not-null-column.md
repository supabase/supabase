---
title: Bulk Upsert with not null column
author: zgramming
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/38829404?u=205777e46c675f088ecad68aee2005eace313de1&v=4
author_url: https://github.com/zgramming
answer: [object Object]
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hello, I wonder how the upsert function works, especially `bulk upsert` (I integrated **Supabase** with **Flutter** ).

In [this](https://supabase.io/docs/reference/javascript/upsert#bulk-upsert-your-data) documentation, is clear how we can upsert multiple data, which in essence we have to enter primary key to the list object. Let me explain my case : 

<table>
        <thead>
            <tr>
                <th>id</th>
                <th>id_user (FK & Not Null)</th>
                <th>id_pairing (FK & Not Null)</th>
                <th>is_archived (Nullable)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>1</td>
                <td>2</td>
                <td>false</td>
            </tr>
            <tr>
                <td>2</td>
                <td>1</td>
                <td>3</td>
                <td>false</td>
            </tr>
            <tr>
                <td>3</td>
                <td>1</td>
                <td>4</td>
                <td>false</td>
            </tr>
            <tr>
                <td>4</td>
                <td>1</td>
                <td>5</td>
                <td>false</td>
            </tr>
        </tbody>
    </table>

In above, i got data in database then i want `bulk upsert` column **is_archived** to TRUE. Then i create `List<Map<String,dynamic>>` by including the primary key and value what i want to update.
```
final data = [
{id: 1, is_archived: true}, 
{id: 2, is_archived: true}, 
{id: 3, is_archived: true},
{id: 4, is_archived: true}
]
```

Then i create query to `bulk upsert` like this : 

```
final result = await _supabase.from(Constant.tableInbox).upsert(data).execute();
```

But i got error when perform the query. 
<img src="https://user-images.githubusercontent.com/38829404/133627297-834d6047-a352-4165-a32d-90bd7c6e6ff7.jpeg" heigh="500" width="300"/>


In documentation it's not giving any information about not null column, in my perception it's good to go when we already including **primary key** into List Object and ignore about constraint or not null column. 

Or my perception is wrong ? Can you give explain about my case ? 

Thank's

---
### Suggested answer
__steve-chavez__ `2 days ago`

Hey @zgramming,

> In above, i got data in database then i want bulk upsert column is_archived to TRUE. Then i create List<Map<String,dynamic>> by including the primary key and value what i want to update.

For this case, wouldn't be better to do an update since the rows already exist? Like so:

```dart
final result = await _supabase.from(Constant.tableInbox).update({'is_archived': true).in('id', [1,2,3,4]).execute();
```

