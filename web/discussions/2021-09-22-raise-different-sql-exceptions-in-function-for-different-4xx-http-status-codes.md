---
title: Raise different SQL exceptions in function for different 4xx HTTP status codes?
author: AJamesPhillips
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/526509?v=4
author_url: https://github.com/AJamesPhillips
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I have a helper function that allows one user to invite another user by their email address or uid to their document (called a base).  It first checks if the base_id is actually owned by them.  If not it currently returns early which results in a 200 status code response.  Later when it tries to insert, if there is a duplicate, supabase correctly returns that as a 409 status code.  Is there a way to set the status code of a response, perhaps by raising a specific exception type?

```sql
CREATE OR REPLACE FUNCTION invite_user_to_base (base_id bigint, email_or_uid text, access_level AccessControlLevel)
returns int
language plpgsql
security definer
SET search_path = public
as $$
DECLARE
  valid_base bool := false;
  usr_uid uuid;
BEGIN
  SELECT $1 in (SELECT get_owned_base_ids_for_authorised_user()) into valid_base;
  IF NOT valid_base THEN RETURN 403; END IF; -- TODO raise 403 instead of returning http status code of 200

  select id INTO usr_uid from auth.users where auth.users.email = email_or_uid OR auth.users.id = uuid_or_null(email_or_uid) LIMIT 1;
  IF usr_uid IS NULL THEN RETURN 404; END IF; -- TODO raise 404 instead of returning http status code of 200

  -- INSERT correctly raises and results in 409 http status code if duplicate base and user id in access_controls
  INSERT INTO access_controls (base_id, user_id, access_level) VALUES (base_id, usr_uid, access_level);

  RETURN 200;
END;
$$;
```

---

<a href="https://github.com/supabase/supabase/discussions/3287#discussioncomment-1368889" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/bnjmnt4n" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/813865?u=631fea8717683d0f6f925b41b3b0d64a89daa96d&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">bnjmnt4n</span>
    <span style={{ color: '#8b949e' }}>a day ago</span>
  </span>
  </a>
  </div>
  This should be possible. Via PostgREST docs: https://postgrest.org/en/v8.0/api.html#raise-errors-with-http-status-codes
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
