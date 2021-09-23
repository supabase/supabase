---
title: Is there a way to disabled sign ups, only to have invite access?
author: benlittlenz
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/39175284?u=12b18fb8f6146c880b75c7a3701d1651d91e7008&v=4
author_url: https://github.com/benlittlenz
category: General
upvoteCount: 2
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi, I am looking for a way to prevent sign up authentication through my web app, only having invite access through the Supabase admin panel.
Is there a way to invite a user, and when the user accepts the invitation through email, the user then set's their password and can then sign in with that password in future?

Thanks in advance!

---

<a href="https://github.com/supabase/supabase/discussions/3208#discussioncomment-1331469" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/kangmingtay" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/28647601?u=6affdd8462b37219bab90e93e91d6800feeaaea9&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">kangmingtay</span>
    <span style={{ color: '#8b949e' }}>8 days ago</span>
  </span>
  </a>
  </div>
  Hey @benlittlenz, the flow would look something like this:

1. Set the "Site URL" on the Authentication --> Settings page to point to your "Set password" form page. 
2. Invite a user via the Supabase admin panel
3. User clicks on the invite link. (get the <ACCESS_TOKEN> here)
4. User is redirected to your password form page to set his / her new password.

You will need to make use of the [`PUT /user`](https://github.com/supabase/gotrue#put-user) endpoint:
```
curl -X PUT 'https://abcdefghijlmnop.supabase.co/auth/v1/user' \                        
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "apikey: <ANON_KEY>"
-d '{
  "password":  <NEW_PASSWORD>
}' \
```

where the `<ACCESS_TOKEN>` can be obtained from local storage (after the user clicks on the invite link) and the `<ANON_KEY>` can be obtained from your supabase dashboard at "Settings --> API".

Btw thanks for bringing this up! I realised the flow isn't as smooth as it should be and a better way to improve the developer experience would be to include another field on the Supabase admin panel to indicate a custom redirect endpoint for invites sent.
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
