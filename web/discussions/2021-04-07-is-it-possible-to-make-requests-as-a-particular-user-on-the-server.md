---
title: "Is it possible to make requests \"as\" a particular user on the server?"
author: churichard
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/4218237?u=b171a62ea2014e40a9ab42943a9079d166eb1ad8&v=4
author_url: https://github.com/churichard
category: Q&A
upvoteCount: 3
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

For context, I'm using Next.js with supabase-js, roughly following the [Next.js with supabase auth example](https://github.com/supabase/supabase/tree/master/examples/nextjs-with-supabase-auth).

I have a policy `uid() = user_id` on a table with row level security turned on, and I want it to work nicely with requests happening on the server side as well. Right now what happens is that requests on the server side fail because I'm using supabase-js with the anon key, and the server doesn't "know" what user is logged in.

I know it'll work if I use the `service_role` key, but I don't want to do that. My logic is in `getServerSideProps` and it would be very easy for someone to accidentally use the `service_role` key to make requests on the client side.

So, my question is: is it possible to "force" supabase-js to make requests *as* a certain user on the server? I can already get the user from the cookie using `supabase.auth.api.getUserByCookie` - can I somehow pass this into the supabase-js client so that it makes requests as that user?

---

<a href="https://github.com/supabase/supabase/discussions/1094#discussioncomment-587587" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/inian" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/2155545?u=2ff9d14b413a4a45c3d45f7335198e11f357d1d1&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">inian</span>
    <span style={{ color: '#8b949e' }}>7 months ago</span>
  </span>
  </a>
  </div>
  Hi @churichard, yes you can do that. You need to generate a JWT with the `sub` claim as the user id and sign the JWT with your JWT secret of your project. Then you can pass that jwt into supabase-js like this. 

```js
const supabase = createClient(supabaseUrl, supabaseKey, {
  headers: {
    apiKey: anonKey,
    Authorisation: `Bearer ${jwt}`
  }
});
```
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">3</span></p>
    <p>0 replies</p>
  </div>
</details> 
