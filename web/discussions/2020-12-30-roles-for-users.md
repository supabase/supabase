---
title: Roles for Users
author: mountiny
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/36083550?u=55ec896530ada25dac87c548d4f04a3b60f79bf2&v=4
author_url: https://github.com/mountiny
answer: [object Object]
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi! I am working on one simple app using your great Stripe, Next.js Starter. I am now stuck with one problem. 

For my app, I need two roles for the users I create, let's say a business and buyer roles. I have different pages on frontend to create buyer user account and to create a business user account. 

However, I struggle to find a way how to create these in database as the call will create generic user and the confirmation email takes the user back to my website with no way for me to distinguish, whether it was business or buyer user. Even if I would use localStorage, I can't assume the user will click the confirmation link in email on the same device or use the same browser for it.

Do  you have any idea or tips how to achieve this workflow? 

Thank you very much!

---
### Suggested answer
__kiwicopple__ `9 months ago`

Are you saving the user to the public schema too ? https://supabase.io/docs/guides/auth#create-a-publicusers-table

If you are then you can probably do this in your signup function. Something like this

```js
const signUpUser = async (email, password, role) => {

  const { user, error } = await supabase
    .auth
    .signUp({ email, password})
    
  const { data, error } = await supabase
    .from('user')
    .update({ role })
    .eq('id', user.id) 
}
```

Hope that helps!


