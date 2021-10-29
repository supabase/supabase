---
title: "Policies don't work on the server with Supabase client (avatars storage example from quickstart)"
author: bennettdams
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/29319414?u=7d621fa8de428f433728359053b343af7d9fe5f1&v=4
author_url: https://github.com/bennettdams
category: Q&A
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

I would like to use the Supabase client on the server (in my case an API route of Next.js), but the policies don't seem to work.

Is there any example for the policies one would need for using storage for a simple "avatar" use case? There are a lot of templates when creating policies and I think I know how to write them, but I don't think I understand why my policies are not working when I use the Supabase client on the server.

### What I want to do:

There's a great [quickstart for Next.js](https://supabase.io/docs/guides/with-nextjs#bonus-profile-photos), but I can't make the storage work with the policies I think I'd need.

Here's what I want to achieve:

- save pictures (jpg, png) in storage
- allow public read access to all avatar pictures
- allow a user to upload (and change) his avatar


`ts
// this function is used on the Next.js API route (so NodeJS, instead of the browser)
export async function uploadAvatarSupabase(
  filepath: string,
  picture: File
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from("avatars")
      .upload(`public/${filepath}`, picture, {
        upsert: true,
        contentType: 'image/jpg',
      })
    if (error) throw error
  } catch (error) {
    throw new Error(
      `Error while uploading avatar file: ${error.message || error}`
    )
  }
}

`

My preferred policies for this use case:

- public read access, even for unauthenticated users
- allow upload for authenticated users

On the server, no matter how the user wants to upload the file, I do validation and change the file name to the user ID. That way, I can make sure that one user can only change his own avatar.

### What works for the upload

- Option 1: Set the storage policies as public access (insert, update, delete) - I obviously can't use this
- Option 2: Set the storage policies to allow access for authenticated users (insert, update, delete) (which is how I want to use them in production) and then execute the upload in the browser

### What does NOT work for the upload
Using the right policies (from Option 2) and then, instead of executing the upload from the browser, executing the upload from the server (a Next.js API route, so NodeJS). The error is speaking for itself: `new row violates row-level security policy for table "objects"` - so I'm violating the policies.







---

<a href="https://github.com/supabase/supabase/discussions/3642#discussioncomment-1528980" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/VictorPeralta" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/8140475?u=be84a4fdeb06e367f08a8d1c1de7daf6e02b63a7&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">VictorPeralta</span>
    <span style={{ color: '#8b949e' }}>5 days ago</span>
  </span>
  </a>
  </div>
  Are you using the service key on the server, or the anon/user jwt? 
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
