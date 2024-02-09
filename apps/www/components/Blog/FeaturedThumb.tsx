import Image from 'next/legacy/image'
import Link from 'next/link'
import authors from 'lib/authors.json'
import PostTypes from '../../types/post'

function FeaturedThumb(blog: PostTypes) {
  // @ts-ignore
  const authorArray = blog.author.split(',')

  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    // @ts-ignore
    author.push(
      authors.find((authors: any) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  return (
    <div key={blog.slug} className="w-full cursor-pointer">
      <Link href={`${blog.path}`} className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative w-full aspect-[2/1] lg:aspect-[3/2] overflow-auto rounded-lg border">
          <Image
            src={`/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
            layout="fill"
            className="object-cover"
            alt="blog thumbnail"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-light flex space-x-2 text-sm">
            <span>{blog.date}</span>
            <span>•</span>
            <span>{blog.readingTime}</span>
          </div>

          <div>
            <h2 className="h2">{blog.title}</h2>
            <p className="p text-xl">{blog.description}</p>
          </div>

          <div className="flex flex-col w-max gap-2">
            {author.map((author: any, i: number) => {
              return (
                <div className="flex items-center space-x-3" key={i}>
                  {author.author_image_url && (
                    <div className="relative h-10 w-10 overflow-auto">
                      <Image
                        src={author.author_image_url}
                        alt={`${author.author} avatar`}
                        className="rounded-full object-cover"
                        layout="fill"
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-foreground m-0 text-sm">{author.author}</span>
                    <span className="text-light m-0 text-xs">{author.position}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default FeaturedThumb
