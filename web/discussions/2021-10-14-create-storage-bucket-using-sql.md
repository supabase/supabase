---
title: "Create storage bucket using SQL?"
author: tskytt
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/23636217?v=4
author_url: https://github.com/tskytt
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Is this good enough for creating a new bucket?:

`insert into storage.buckets (id, name) values ('avatars', 'avatars')`

Good enough meaning it correctly creates the s3 bucket behind the scenes etc.

Another option would be to enable the http extension and do a POST to /storage/v1/bucket/ in the SQL with the proper payload. However, this does not seem to work on my insert trigger function on auth.users. It generates an error: "http_request" does not exist. Don't know why. It works after that trigger in other functions.

---

<a href="https://github.com/supabase/supabase/discussions/3528#discussioncomment-1477580" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/GaryAustin1" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/54564956?u=fe5df86f42698e94e19896b6e424ecc9a7a188e8&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">GaryAustin1</span>
    <span style={{ color: '#8b949e' }}>15 days ago</span>
  </span>
  </a>
  </div>
  This answer appears to be wrong as to what a bucket is as per below.
No.  They have to be created thru the storage API. Just remember buckets in S3 are limited (100 I think) depending on what your trying to do.
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
