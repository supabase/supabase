---
title: new Supabase user - query not returning anything (React)
author: mohnish7
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/7302380?u=a480533481cfd3cfec6d20d8f805dc57b241e084&v=4
author_url: https://github.com/mohnish7
category: General
upvoteCount: 1
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hello,

I have a populated table with row level security enabled in Supabase and I'm hoping to read some of that data into my SPA that I'm building in React. I've (checked) that I've correctly followed the documentation to store my database URL and API key, but when I actually run my query, I'm getting an undefined value for data back despite getting a 200 status. 

See below:

```
useEffect(() => {
  const loadUser = async () => {
    await getUserInformation(currentUser.uid).then((snapshot) => {
          setUserInformation([{"data": snapshot.docs[0].data(), "id": snapshot.docs[0].id}])     
      })
  }


  const formData = async () => {
    let { data, error, status } = await supabase.from('database_name').select('*')
    console.log(status)
    console.log(data)

    if (error) {
      throw Error()
    }

    if (data) {
      setOptions(data)
    }
  }

  loadUser()
  formData()
  setLoading(false)
}, [currentUser]);
```

<img width="355" alt="Screen Shot 2021-09-19 at 10 38 19 AM" src="https://user-images.githubusercontent.com/7302380/133931588-9223a5e1-4fdf-44ee-b267-4f9a1e0f6457.png"/>


Any idea why this may be happening? I can't seem to figure out a way to solve this problem

---

<a href="https://github.com/supabase/supabase/discussions/3255#discussioncomment-1354750" className="margin-bottom--md">Open on GitHub</a>

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
  Hi @mohnish7!

It seems like you are getting empty array, which makes me think the row level security that you are setting is blocking this user from loading any data. Could you show the row level security rule that you applied to your database?
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">1</span></p>
    <p>0 replies</p>
  </div>
</details> 
