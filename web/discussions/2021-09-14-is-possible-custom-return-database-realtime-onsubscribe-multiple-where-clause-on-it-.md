---
title: Is possible custom return Database Realtime onSubscribe & multiple where clause on it ?
author: zgramming
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/38829404?u=205777e46c675f088ecad68aee2005eace313de1&v=4
author_url: https://github.com/zgramming
answer: [object Object]
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

---
### Suggested answer
__zgramming__ `4 days ago`

Hi @dshukertjr ! thank's for your response. 

> Also, if you are using Flutter, it might be easier to listen to realtime data using stream() method! Let me know what you think of it!

Yes, because my project using flutter and Supabase package support to using [stream](https://pub.dev/packages/supabase/example) in pub.dev, i already implement like this : 

```
final boxProfile = Hive.box<ProfileHiveModel>(Constant.hiveKeyBoxProfile);
final listen = Constant.supabase
      .from("inbox:id_user=eq.${user?.id}")
      .stream()
      .order('inbox_last_message_date')
      .execute()
      .listen((events) async {
    if (events.isNotEmpty) {
      ProfileModel? sender;

      /// Check if sender exists in Hive Box
      /// if exists, we used it from local database
      /// otherwise call API
      for (final event in events) {
        if (boxProfile.containsKey(event['id_sender'])) {
          final getProfile = boxProfile.get(event['id_sender']);
          sender = const ProfileHiveModel().convertToProfileModel(getProfile);
        } else {
          sender = await SupabaseQuery.instance.getUserById(event['id_sender'] as int);
          boxProfile.put(sender.id, const ProfileHiveModel().convertFromProfileModel(sender));
        }

        final inbox = InboxModel.fromJson(event).copyWith(sender: sender);
        ref.read(InboxProvider.provider.notifier).upsertInbox(inbox);
      }
    }
  });
```
A little explain about above code, i listen to table **inbox** where id_user equal to user login id, so i only receive return from stream where have any changes on table **inbox** equal to id_user. Then i check if sender exists in my local database **(Hive in my case)**, if sender exists in the local then i using from local, otherwise i call API to supabase to get user by id. 

It's works what i expected, but i notice return from stream is `List<Map<String,dynamic>>` . The problem about this (IMO), if only single row changes in **Inbox**, it will return all data on **inbox** equal to id_user i have defined before. Let me explain this with table : 

<table>
    <thead>
        <tr>
            <th>id</th>
            <th>inbox_channel</th>
            <th>id_user</th>
            <th>id_sender</th>
            <th>message</th>
            <th>message_date</th>
            <th>X</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>1_2</td>
            <td>1</td>
            <td>2</td>
            <td>Hello Zeffry I icha</td>
            <td>123456</td>
            <td>Only this row have changes on table</td>
        </tr>
        <tr>
            <td>2</td>
            <td>1_3</td>
            <td>1</td>
            <td>3</td>
            <td>Hello Zeffry I riri</td>
            <td>123456</td>
        </tr>
        <tr>
            <td>1</td>
            <td>1_4</td>
            <td>1</td>
            <td>4</td>
            <td>Hello Zeffry I budi</td>
            <td>123456</td>
        </tr>
        <tr>
            <td>1</td>
            <td>1_5</td>
            <td>1</td>
            <td>5</td>
            <td>Hello Zeffry I joko</td>
            <td>123456</td>
        </tr>
    </tbody>
</table>

As I described above, if only **id 1** have changes  in **inbox**, then stream will return all data on **inbox** equal id_user. So stream will return like this : 

## return from stream
```
[{"id":1,"inbox_channel":"1_2","id_user":"1","id_sender":"2","message":"hello zeffry i icha","message_date":"11112222333"},{"id":2,"inbox_channel":"1_3","id_user":"1","id_sender":"3","message":"hello zeffry i riri","message_date":"11112222333"},{"id":1,"inbox_channel":"1_4","id_user":"1","id_sender":"4","message":"hello zeffry i budi","message_date":"11112222333"},{"id":1,"inbox_channel":"1_5","id_user":"1","id_sender":"5","message":"hello zeffry i joko","message_date":"11112222333"}]
```

If we using **onSubscribe**, it will return single data only changes on **inbox** and we have ability to detect is **Delete/Insert/Update** type.

## return from onSubscribe(only data changes return)

```
{"id":1,"inbox_channel":"1_2","id_user":"1","id_sender":"2","message":"hello zeffry i icha","message_date":"11112222333"}
```

The problem i think use **stream** rather than **onSubscribe** is if my **inbox** have large data example 1000 rows with id_user == 1, then if only 1 row changes in **inbox**, stream will return 1000 rows. 
So i ask about best practice to handle this scenario, it's okay if stream will return all data although is only 1 row changes in **inbox** or any recommendation ?


> You would achieve this by creating multiple listeners:

For second question, i think your advice it's not suitable for me. Because you create **2 subscribe**, but i need only **1 subscribe** with multiple where clause. 

If i follow your advice, it will create **2 subscribe** then if subscribe detect changes on table it will multiple return.

So **onSubscribe** can't execute multiple where clause like my example above ? 

```
const mySubscription = supabase
  .from('countries:id=eq.200, countries:id_user=eq.100')
  .on('UPDATE', handleRecordUpdated)
  .subscribe()
```

