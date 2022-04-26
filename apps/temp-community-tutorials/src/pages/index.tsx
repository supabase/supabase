import { fetchPosts, DevPost } from '../utils/api'
import { Button, Layouts } from 'common'
import { useEffect, useState } from 'react'

export default function Main() {
  const [postList, setPostList] = useState([] as DevPost[])

  useEffect(() => {
    async function fetchData() {
      const posts = await fetchPosts()
      setPostList(posts)
    }
    fetchData()
  }, [])

  return (
    <Layouts.SidebarLayout sidebarContent={<div>Shared Sidebar</div>}>
      <h1 className="text-2xl font-semibold text-gray-900">Tutorials</h1>
      {postList.map((x) => (
        <div className="pb-4">
          <h2>{x.title}</h2>
          <p>{x.description}</p>
        </div>
      ))}
    </Layouts.SidebarLayout>
  )
}
