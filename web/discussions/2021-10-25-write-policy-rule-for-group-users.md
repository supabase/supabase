---
title: "Write policy rule for group users"
author: ReactGuru007
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/49508937?v=4
author_url: https://github.com/ReactGuru007
category: Q&A
upvoteCount: 2
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Is it possible to write a policy for a group of users instead of just `uid() = created_by`?

for example, if I would like to have read access for people that are in the same team, right now I have to build a service for that. Would be nice to have the policy to take care of that. Is something like a function feasible for that. any insight is greatly appreciated.

users
id (primary)
account_id (foreign key)

accounts 
id (primary)

users from the same group can access their records.



---

<a href="https://github.com/supabase/supabase/discussions/3647#discussioncomment-1529798" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/VictorPeralta" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/8140475?u=be84a4fdeb06e367f08a8d1c1de7daf6e02b63a7&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">VictorPeralta</span>
    <span style={{ color: '#8b949e' }}>5 days ago</span>
  </span>
  </a>
  </div>
  You can see this example in the docs, I think that's what you're looking for. 

https://supabase.io/docs/guides/auth/row-level-security#policies-with-joins
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
