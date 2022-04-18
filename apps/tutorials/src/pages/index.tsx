import { fetchPosts, DevPost } from '../utils/api'

export default function Tutorials({ posts }: { posts: DevPost[] }) {
  return (
    <div>
      <h1>Tutorials</h1>
      {posts.map((x) => (
        <div>
          <h2>{x.title}</h2>
          <p>{x.description}</p>
        </div>
      ))}
    </div>
  )
}

export async function getServerSideProps() {
  const posts = await fetchPosts()
  return {
    props: { posts },
  }
}
