---
title: "Rate limits for database inserts per second"
author: tobbbe
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/2511610?u=84326e237c8e79e98c70c92dbe5b390811e36f42&v=4
author_url: https://github.com/tobbbe
category: General
upvoteCount: 2
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hello!
Is there any rate limits per second for database inserts? Either from Supabase or Postgres

---

<a href="https://github.com/supabase/supabase/discussions/3651#discussioncomment-1536585" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/awalias" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/458736?u=7bc13764a2f8dd974acc7ca284850390a6f914e0&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">awalias</span>
    <span style={{ color: '#8b949e' }}>4 days ago</span>
  </span>
  </a>
  </div>
  we don't have any rate limits in place right now for the CRUD API, you can pretty much go as hard as you want since each database has it's own dedicated resources (which can be increased on the paid tiers)

I ran some benchmarks this morning and the CRUD API is capable of sustaining up to 1200 reads per second for the free tier, and up to 1000 inserts per second

soon you will be able to configure rate limiting yourself from the dashboard, but as of today this is a work in progress
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
