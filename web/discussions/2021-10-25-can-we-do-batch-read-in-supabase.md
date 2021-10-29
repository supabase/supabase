---
title: "Can we do batch read in Supabase?"
author: RatulSaha
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/4464135?u=65ff2c00cbe4e7e4bfb264852eea681ee4c20ca9&v=4
author_url: https://github.com/RatulSaha
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Newbie here. I have multiple select/eq requests that I was hoping to batch to reduce round trips (and maybe database read time). Something like


`
await supabase
        .from("table")
        .select("*")
        .batcheq[("column", val1), ("column", val2), ("column", val3)]

`

Is it possible to achieve this with RPC or some other way?

---

<a href="https://github.com/supabase/supabase/discussions/3646#discussioncomment-1529348" className="margin-bottom--md">Open on GitHub</a>

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
    <span style={{ color: '#8b949e' }}>5 days ago</span>
  </span>
  </a>
  </div>
  `.in('column', [val1, val2, val3])`
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
