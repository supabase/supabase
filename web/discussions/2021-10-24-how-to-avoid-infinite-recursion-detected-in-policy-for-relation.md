---
title: "How to avoid infinite recursion detected in policy for relation?"
author: ReactGuru007
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/49508937?v=4
author_url: https://github.com/ReactGuru007
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi there, 

I would like to create a policy to restrict select access.


`sql
(EXISTS ( SELECT users.id FROM (users JOIN accounts ON ((accounts.id = users.account_id))) WHERE (uid() = users.id))) //✅

`

The above works fine, but as soon as I start to join another table, I hit the problem with recursion detected issue. 


`sql
(EXISTS ( SELECT 
  users.id FROM 
  (
    (users JOIN accounts ON ((accounts.id = users.account_id))) 
    LEFT JOIN tasks task_1 ON ((task_1.account_id = users.account_id)
  )) 
  WHERE (uid() = users.id))) // ❌

`

The tables

**Users**
id
`account_Id`

**Accounts**
`id`

**Tasks**
`account_Id`

---------------

Is it possible to write a policy that only associated account users can view? or do I need to build a service and use the admin role to filter out the data.

Thanks for any help in advance. 🙏 




---

<a href="https://github.com/supabase/supabase/discussions/3635#discussioncomment-1529352" className="margin-bottom--md">Open on GitHub</a>

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
    <span style={{ color: '#8b949e' }}>5 days ago</span>
  </span>
  </a>
  </div>
  Can you try these answers? https://github.com/supabase/supabase/discussions/3328 https://github.com/supabase/supabase/discussions/1138
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
