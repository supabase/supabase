---
title: "Help with row level security"
author: tobbbe
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/2511610?u=84326e237c8e79e98c70c92dbe5b390811e36f42&v=4
author_url: https://github.com/tobbbe
category: General
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hello!
I have 3 tables:

**videos**
id
name
project_id

**projects**
id
name

**project_members**
project_id
user_id

I want a rule that allows a user to only access videos for projects the user belongs to.

I've tried this for example, doesnt work:

`
(
  EXISTS (
    SELECT
      1
    FROM
      project_members
    WHERE
      (
        (project_members.user_id = uid())
        AND (project_members.project_id = videos.project_id)
      )
  )
)

`

I also want a user to be able to get all projects she belongs to.

Please help! I'm ripping my hair of :( 


---

<a href="https://github.com/supabase/supabase/discussions/3695#discussioncomment-1557478" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/soedirgo" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/31685197?u=8aff941b133b7627af28427a656602f4749b735e&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">soedirgo</span>
    <span style={{ color: '#8b949e' }}>14 hours ago</span>
  </span>
  </a>
  </div>
  Hi @tobbbe, you'll need a `SECURITY DEFINER` function for recursive policies like this. In this case, you can try:
```sql
-- Parameters need to be prefixed because the name clashes with `pm`'s columns
CREATE FUNCTION is_member_of(_user_id uuid, _project_id uuid) RETURNS bool AS $$
SELECT EXISTS (
  SELECT 1
  FROM project_members pm
  WHERE pm.project_id = _project_id
  AND pm.user_id = _user_id
);
$$ LANGUAGE sql SECURITY DEFINER;
```
Then in your `videos` policy definition:
```sql
is_member(auth.uid(), project_id)
```
Likewise, in your `projects` policy definition:
```sql
is_member(auth.uid(), id)
```

See also: https://github.com/supabase/supabase/discussions/3495 https://github.com/supabase/supabase/discussions/3328
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
