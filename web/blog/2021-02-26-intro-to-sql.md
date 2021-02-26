---
title: A half-hour to learn SQL
description: Build a to do app with Postgres
author: Paul Copplestone
author_title: Supabase
author_url: https://github.com/kiwicopple
author_image_url: https://github.com/kiwicopple.png
authorURL: https://github.com/kiwicopple
image: /img/roboflow-og.png
tags:
  - SQL
  - Postgres
---


Imagine there was a messenger app which changed its policies to infringe on privacy. As a result you decided to build your own messenger application, one where you owned all the data. Where would you store that data? Perhaps a database? Perhaps a Relational Database? Perhaps PostgreSQL?

In this article, instead of focusing on one or two concepts, I'll try to go through as many Postgres snippets as I can. Along the way we will be building a Chat Application, very similar to Slack.


### Tables

Relational databases are made of `tables`. Tables are like "groups" of data. In our messenger app, we need to store messages. So let's create a table for it:


```sql
create table messages (
  message text
);
```

This table has a `column` named `message`, for storing `text`. Sometimes we want to add some rules to our columns. For example I might want to ensure that the `message` column is never empty.


```sql
alter table messages  
alter column message set not null;
```

We may also want to put some restrictions on our columns. For example we may want to reject any messages that are longer than 1000 characters.

```sql
alter table messages
   add contraint message_less_than_1000
   check( len(message) < 1000 );
```

There are a variety of different column types we can use. Perhaps we want to store a timestamp every time a message is created?


```sql
alter table messages
add column inserted_at 
  timestamp with time zone        -- data type
  default timezone('utc', now())  -- default value
  not null;                     
```

Wow I went crazy with that one. I added a timestamp with the timezone included. I also made it default to the current time (UTC), and put a constraint to make sure it is never empty (`not null`).


How can we differentiate two messages that are the same? 

text |
------ | 
"Hello World"   |   
"Hello World"   |   


We can differentiate them with a unique key. This is called a `Primary Key`.

```sql
alter table messages
add column id serial primary key;
```

We made it a `serial`. That's a built-in "number" type, which will increment up every time. Now our data would look like:


id | text |
---- | -----
1  | "Hello World" |
2  | "Hello World" |


### Data

Adding data to our tables is as easy 