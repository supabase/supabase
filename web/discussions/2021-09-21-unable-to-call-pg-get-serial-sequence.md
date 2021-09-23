---
title: Unable to call pg_get_serial_sequence
author: CR1AT0RS
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/4299288?u=c0183d8e83cab1ba84127c4a9706c75578d80234&v=4
author_url: https://github.com/CR1AT0RS
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I wanna get the nextvalue of id. I am trying in console to call.
```
select  pg_get_serial_sequence ('Emails', 'id')
select coalesce(NEW.id, nextval('emails_id_seq'));
SELECT nextval('Emails_id_seq');

```
They return error: 
`relation "emails_id_seq" does not exist`


Overall I am trying to creating this function:
```
-- Change items and its sequence according to your table
CREATE OR REPLACE FUNCTION items_null_id_is_default() RETURNS TRIGGER AS $$
BEGIN
  NEW.id = coalesce(NEW.id, nextval('items_id_seq'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER items_null_id_is_default 
BEFORE INSERT ON items FOR EACH ROW EXECUTE PROCEDURE items_null_id_is_default();
```

In Pgadmin I can see that relation does exist
` public     | Emails_id_seq             | sequence      | supabase_admin`


---

<a href="https://github.com/supabase/supabase/discussions/3279#discussioncomment-1364374" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/CR1AT0RS" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/4299288?u=c0183d8e83cab1ba84127c4a9706c75578d80234&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">CR1AT0RS</span>
    <span style={{ color: '#8b949e' }}>2 days ago</span>
  </span>
  </a>
  </div>
  For anyone else if your table has any Capital Letter in my case 'E' in 'Emails' then you have to call it like this to preserve Capital letter:
select nextval('"Emails_id_seq"');
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
