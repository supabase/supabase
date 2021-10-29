---
title: "Magic link url for staging/preview environment"
author: lucasnantonio
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/13240286?u=f5b7a15c91129a55e8ec9ab2b788a91757c6b630&v=4
author_url: https://github.com/lucasnantonio
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I'm using Vercel to test and deploy my app. Whenever I push to a new branch, it creates a Preview deployment with an URL like:

https://my-app-hfhqhjvnu-myname.vercel.app/

These URLs are different every time, which means my magic links break when I try to log in.

Am I missing something? Is there a way to login into preview/stating deployments like these using magic links?

Thanks in advance!

---

<a href="https://github.com/supabase/supabase/discussions/3686#discussioncomment-1558008" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/silentworks" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/79497?u=b3022ea9fed70089f0c4f054bf6774c79316c7c3&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">silentworks</span>
    <span style={{ color: '#8b949e' }}>12 hours ago</span>
  </span>
  </a>
  </div>
  I've answered this over here https://github.com/supabase/supabase/discussions/2760#discussioncomment-1144158, do note that you still have to do some manual work of adding the preview deployment URL to the **"Additional Redirect URLs"** each time though.
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
