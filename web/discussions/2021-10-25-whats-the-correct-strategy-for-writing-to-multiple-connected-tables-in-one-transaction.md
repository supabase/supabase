---
title: "What's the correct strategy for writing to multiple connected tables in one transaction?"
author: fergusmeiklejohn
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/11864025?u=aaf0a27a9e98b054fa9e72ffbe4e172bf46d6e8c&v=4
author_url: https://github.com/fergusmeiklejohn
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Like most schemas, the one I'm working on has lots of FK connected tables. A write operation would need to complete on all connected tables or fail.
So I'm wondering what the best strategy is for this? I suppose we use a stored procedure .rpc()?
Then how does RLS and auth work with procedures?
And what if we validate the data on the server before writing? How do we pass the auth state to the server?

Thanks!

---

<a href="https://github.com/supabase/supabase/discussions/3649#discussioncomment-1530090" className="margin-bottom--md">Open on GitHub</a>

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
    <span style={{ color: '#8b949e' }}>5 days ago</span>
  </span>
  </a>
  </div>
  As you've mentioned, using a stored procedure is typically the way to do this for now, since they are executed within a transaction. The stored procedure you use should be created with `security invoker`, since using `security definer` would lead to RLS policies not being applied.

When sending requests from your client to your server, you should ensure that the user's JWT is passed, either as a cookie or maybe a request parameter. Then, on the server, you can modify the supabase API client to use the current user's JWT like mentioned here (https://github.com/supabase/supabase/discussions/1094#discussioncomment-714633). This will allow you to emulate the user when making the request, allowing existing RLS policies to be respected.


  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
