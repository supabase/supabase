const username = 'supabase'
const postsUrl = `https://dev.to/api/articles?username=${username}`

// Defines a Post returned from the DEV API
export type DevPost = {
  id: Number
  title: string
  description: string
  slug: string
  url: string
  path: string
  readable_publish_date: string
  published_at: string
  tags: string
  tag_list: string[]
  comments_count: Number
  public_reactions_count: Number
  positive_reactions_count: Number
  published: boolean
  first_published_at: string
  edited_at: string
  user: {
    username: string
    name: string
    profile_image_90: string
    cover_image_90: string
    profile_image_original: string
    cover_image_original: string
    location: string
    website: string
    bio: string
    twitter_username: string
    github_username: string
    dribbble_username: string
    path: string
  }
  organization: {
    id: Number
    name: string
    slug: string
    profile_image_90: string
    profile_imag: string
  }
}

export async function fetchPosts() {
  try {
    const res = await fetch(postsUrl)
    const data: DevPost[] = await res.json()
    return data
  } catch (err) {
    console.log(err)
    return []
  }
}
