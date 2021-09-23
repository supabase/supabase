---
title: supabase.auth.user() is returning user as null
author: nickbyte
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/5063465?u=4d988b9252bbf5ee3eb91fd9c142e3fc51d3b98d&v=4
author_url: https://github.com/nickbyte
category: General
upvoteCount: 2
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Using the new phone auth, when trying to fetch the user id, the user ID is null, how to resolve this?

---

<a href="https://github.com/supabase/supabase/discussions/3222#discussioncomment-1337760" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/kangmingtay" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/28647601?u=6affdd8462b37219bab90e93e91d6800feeaaea9&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">kangmingtay</span>
    <span style={{ color: '#8b949e' }}>7 days ago</span>
  </span>
  </a>
  </div>
  Hey @nickbyte and @notjustinshaw, 

Thanks for pointing this out! You can obtain the user information from the access token JWT payload. The user ID can be retrieved from the "sub" field in the JWT as it's the same as the "id" field stored in the database. 

Hope this helps!
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
