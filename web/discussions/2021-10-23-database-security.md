---
title: "Database security"
author: christrunk
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/83041942?u=f6dab5a7a16286dbe37cb7165ffa2059540b318c&v=4
author_url: https://github.com/christrunk
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi there,

I've worked in or managed development teams for almost 15 years. In whatever company or system I've worked on, the database is securely tucked away behind a firewall and/or multiple layers of authentication.

On Supabase, the Postgres DB seems to be fully accessible with read/write with just a plain username and password.

Is that right?

Could it be vulnerable to a stolen password, or brute-forcing?

I'm not a Postgres or DB guy, just the part of the team that would be worried about security, so I might be misunderstanding the setup with Supabase.

Can someone help me sleep better at night please? 😀

---

<a href="https://github.com/supabase/supabase/discussions/3634#discussioncomment-1538623" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/dshukertjr" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/18113850?u=d27502ff73c45f1f38b8c7ed002238a8d466f2f8&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">dshukertjr</span>
    <span style={{ color: '#8b949e' }}>3 days ago</span>
  </span>
  </a>
  </div>
  Hi @christrunk!

Postgres DB used in Supabase is behind an authentication layer just like any other databases out there.

As long as you have configured [row level security policies](https://supabase.io/docs/guides/auth/row-level-security), your database should be nice and secure. Gotrue, the authentication server used in Supabase has mechanisms to prevent brute-forcing as you can see [here](https://github.com/supabase/gotrue/blob/master/api/api.go#L125). Whether a stolen password could be critical or not is up to how you configure your security policy, I think. 
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
