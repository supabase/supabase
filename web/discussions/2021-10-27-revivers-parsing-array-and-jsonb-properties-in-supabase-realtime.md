---
title: "Revivers / Parsing Array and JSONb properties in Supabase Realtime"
author: stevenolay
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/9903968?u=0efa50cd445dc927f50e1ab8ab80ebb3ce5d1f0f&v=4
author_url: https://github.com/stevenolay
category: General
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

This is an example record that I get from the Supabase realtime socket. 


`
{
   "active":"f",
   "nickname":null,
   "phone_numbers":"{+165055511111, +16505552222}",
   "photo_url":null,
   "primary_email":null,
   "primary_email_verified":null,
   "primary_phone_number":"+165055511111",
}

`

Booleans remain as strings in the form "f" or "t"

Arrays come back in the following format "{val1, val2, val3}"

Are there any built in utilities/utilities you can point me to to transform these properties into native JSON arrays and booleans?

I.E


`
{
   "active": false,
   "nickname":null,
   "phone_numbers":["+165055511111", "+16505552222"],
   "photo_url":null,
   "primary_email":null,
   "primary_email_verified":null,
   "primary_phone_number":"+165055511111",
}

`

Am i potentially missing a setting in the setup of the realtime server or my socket subscription?

---

<a href="https://github.com/supabase/supabase/discussions/3683#discussioncomment-1548857" className="margin-bottom--md">Open on GitHub</a>

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
    <span style={{ color: '#8b949e' }}>2 days ago</span>
  </span>
  </a>
  </div>
  For what it is worth, in Supabase's realtime.js they have a transformer function to convert all the responses coming back from the channel into json before passing it on as a payload response.  
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
