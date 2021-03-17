import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { generateReadingTime } from './helpers'

// substring amount for file names
// based on YYYY-MM-DD format
const FILENAME_SUBSTRING = 11

//Finding directory named "blog" from the current working directory of Node.
const postDirectory = path.join(process.cwd(), '_blog')

export const getSortedPosts = (limit?: number, tags?: any) => {
  //Reads all the files in the post directory
  const fileNames = fs.readdirSync(postDirectory)

  // categories stored in this array

  let allPostsData = fileNames.map((filename) => {
    const slug = filename.replace('.mdx', '')

    const fullPath = path.join(postDirectory, filename)
    //Extracts contents of the MDX file
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    const options = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(data.date).toLocaleDateString('en-IN', options)

    const readingTime = generateReadingTime(content)
    const dates = getDatesFromFileName(filename)

    // construct url to link to blog posts
    // based on datestamp in file name
    const url = `${dates.year}/${dates.month}/${dates.day}/${slug.substring(FILENAME_SUBSTRING)}`

    const frontmatter = {
      ...data,
      date: formattedDate,
      readingTime,
      url: url,
    }
    return {
      slug,
      ...frontmatter,
    }
  })

  allPostsData = allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1
    } else {
      return -1
    }
  })

  if (tags) {
    allPostsData = allPostsData.filter((post: any) => {
      const found = tags.some((tag: any) => post.tags.includes(tag))
      return found
    })
  }

  if (limit) allPostsData = allPostsData.slice(0, limit)

  return allPostsData
}

// Get Slugs
export const getAllPostSlugs = () => {
  const fileNames = fs.readdirSync(postDirectory)

  return fileNames.map((filename) => {
    return {
      params: {
        slug: filename.replace('.mdx', '').substring(FILENAME_SUBSTRING),
        ...getDatesFromFileName(filename),
      },
    }
  })
}

// Get Post based on Slug
export const getPostdata = async (slug: string) => {
  const fullPath = path.join(postDirectory, `${slug}.mdx`)
  const postContent = fs.readFileSync(fullPath, 'utf8')

  return postContent
}

export const getAllCategories = () => {
  const posts = getSortedPosts()
  let categories: any = []

  posts.map((post: any) => {
    // add tags into categories array
    post.tags.map((tag: string) => {
      if (!categories.includes(tag)) return categories.push(tag)
    })
  })

  return categories
}

const getDatesFromFileName = (filename: string) => {
  // extract YYYY, MM, DD from post name
  const year = filename.substring(0, 4)
  const month = filename.substring(5, 7)
  const day = filename.substring(8, 10)

  return {
    year,
    month,
    day,
  }
}
