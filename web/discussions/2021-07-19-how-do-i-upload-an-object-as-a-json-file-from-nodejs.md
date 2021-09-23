---
title: How do I upload an object as a json file from node.js?
author: 72L
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/5567899?u=76ce68724f1119a7932da201f44a8032a382a435&v=4
author_url: https://github.com/72L
category: Q&A
upvoteCount: 1
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Could anyone give an example of uploading an object to Supabase storage as a JSON file?

I'd like to upload an object from a backend node.js server. Therefore, I cannot use the client-side `File` interface.

The objects are small enough to fit in memory, so ideally this process would stay all in memory so I don't have to write a file to disk.

Thanks!

---

<a href="https://github.com/supabase/supabase/discussions/2446#discussioncomment-1024370" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/thebengeu" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/1154867?u=14a741e1410656d21dc10c8f2210673378d12faa&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">thebengeu</span>
    <span style={{ color: '#8b949e' }}>2 months ago</span>
  </span>
  </a>
  </div>
  Since supabase/storage-js#5 was resolved, implementing server side storage upload, you can now use a Node.js `Buffer` or `Stream` (and many other types) with [from.upload()](https://supabase.io/docs/reference/javascript/storage-from-upload):

```
await supabase
  .storage
  .from('bucket')
  .upload('folder/file.json', jsonFile, {contentType: 'application/json'})
```
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
