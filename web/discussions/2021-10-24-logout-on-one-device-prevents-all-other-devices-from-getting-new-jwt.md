---
title: "Logout on one device prevents all other devices from getting new jwt"
author: Vinzent03
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/63981639?u=0d13b5f15c463560f812096925b9db7adc27d0a0&v=4
author_url: https://github.com/Vinzent03
category: Q&A
upvoteCount: 2
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I am using the dart SDK, but I think that doesn't matter.

Let's say I'm signed in on device A and B. Now I log out on Device A. This [revokes](https://github.com/supabase/gotrue#post-logout) all refresh tokens in `auth.refresh_tokens`. Now my jwt expires on device B and I want to get a new jwt by calling the [token](https://github.com/supabase/gotrue#post-token) endpoint. This requires a refresh token, this is saves on the client, but because of the log out on device A, it's revoked and doesn't work. Which causes device B to be logged out too.

So my question is, is this intended or is my workflow wrong?

---

<a href="https://github.com/supabase/supabase/discussions/3637#discussioncomment-1537306" className="margin-bottom--md">Open on GitHub</a>

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
  hey @Vinzent03 , flipping this into an issue because I agree we should add support for multiple concurrent sessions as you point out. It shouldn't be too difficult to add, but it will require plenty of testing and a clear migration path (as with all auth changes)
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
