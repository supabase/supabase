export interface StaticContent {
  latestBlogPosts: Array<{
    title: string
    url: string
    description: string
    date: string
    formattedDate: string
  }>
  jobsCount: number
  githubStars: number
}

// Default values for client-side rendering
const defaultStaticContent: StaticContent = {
  latestBlogPosts: [],
  jobsCount: 0,
  githubStars: 0,
}

/**
 * Get latest blog posts from static content
 * Only works on server-side during build time
 */
export const getLatestBlogPosts = (): StaticContent['latestBlogPosts'] => {
  // Always return empty array for client-side usage
  return defaultStaticContent.latestBlogPosts
}

/**
 * Get jobs count from static content
 * Only works on server-side during build time
 */
export const getJobsCount = (): number => {
  // Always return default value for client-side usage
  return defaultStaticContent.jobsCount
}

/**
 * Get GitHub stars from static content
 * Only works on server-side during build time
 */
export const getGitHubStars = (): number => {
  // Always return default value for client-side usage
  return defaultStaticContent.githubStars
}
