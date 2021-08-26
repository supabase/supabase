---
title: My Auth Suddenly Not Working
author: mazipan
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/7221389?u=cd8e279f95d479997ba55e106c44b96fdc7f979e&v=4
author_url: https://github.com/mazipan
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: true
---

I have application here: https://ksana.in/auth/sign-in that suddenly can not use any auth method from Supabase.

![Screen Shot 2021-08-17 at 17 18 57](https://user-images.githubusercontent.com/7221389/129708977-2f1af5ee-f73c-41f8-977e-a3b6cc7a193f.png)

For example, the Google Login will redirect to:

```
https://oirhwazlkofldqlyoamp.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://ksana.in/callback
``` 

I can ping the domain

![Screen Shot 2021-08-17 at 17 21 20](https://user-images.githubusercontent.com/7221389/129709330-3757f11e-8b73-46b1-8f02-1ffea090e630.png)

Is there any changes I missing from Supabase side? I already update the version to the latest version, but still no luck. 

Looking the report, it happen from 16 Aug 2021. All request suddenly gone

![Screen Shot 2021-08-17 at 17 25 43](https://user-images.githubusercontent.com/7221389/129710024-19a12314-882e-4530-b0c0-2a11d58e39a5.png)

