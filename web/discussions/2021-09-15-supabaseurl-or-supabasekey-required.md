---
title: supabaseUrl or supabaseKey required
author: CaseyG5
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/16518948?u=e70b396d1dc50cb82533e1e9540818c96de057fe&v=4
author_url: https://github.com/CaseyG5
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

1. `Error: supabaseUrl is required.`
2. `Error: supabaseKey is required.`

SupabaseClient.ts:
`   51 | this.storageUrl = `${supabaseUrl}/storage/v1`;`
`> 52 | this.schema = settings.schema;`

These two errors I'm getting in my React project (one at a time, not both together) are rather frustrating since my supabaseUrl and supabaseKey are, and have always been, provided to the `createClient()` function or `SupabaseClient()` constructor.  For the first error, Supabase complains about line 51 in it's own file.  For the second, line 52 is a problem.

I updated `@supabase/supabase-js` from version 1.22.5 to 1.22.6 and the URL error disappeared temporarily but then I switched to using my Service key instead of my Anon key and now the KEY error has taken its place.  Is this a Supabase bug that is plaguing anyone else?  Thanks for any tips you might have.

Casey

---

<a href="https://github.com/supabase/supabase/discussions/3218#discussioncomment-1335749" className="margin-bottom--md">Open on GitHub</a>

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
    <span style={{ color: '#8b949e' }}>7 days ago</span>
  </span>
  </a>
  </div>
  Hi @CaseyG5!

I am sorry that you are having some trouble. I just upgraded one of my Next.js project to use both v1.22.5 and v1.22.6 of `supabase-js`, and was not able to reproduce this issue with both annon key and service key. Do you know if this issue happened on earlier versions of `supabase-js`?

Could you share your code where you are calling `createClient()`?
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
