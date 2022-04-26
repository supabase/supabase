import { fetchDiscussions } from '../utils/api'
import { Button, Layouts } from 'common'
import { useEffect, useState } from 'react'

export default function Main() {
  const [discussionList, setDiscussionList] = useState([] as any[])

  useEffect(() => {
    async function fetchData() {
      const discussions = await fetchDiscussions()
      setDiscussionList(discussions)
    }
    fetchData()
  }, [])

  return (
    <Layouts.SidebarLayout
      sidebarContent={
        <div className="p-4 text-white">
          <div className="text-sm uppercase">Categories</div>
          <div>One</div>
          <div>Two</div>
        </div>
      }
    >
      <h1 className="text-2xl font-semibold text-gray-900">Discussions</h1>
      {discussionList.map((x) => (
        <div className="pb-4">
          <h2 className="text-lg font-semibold">{x.title}</h2>
          <p>{x.body}</p>
        </div>
      ))}
    </Layouts.SidebarLayout>
  )
}
