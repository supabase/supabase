import Image from 'next/image'
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
    <div key={blog.slug} className="w-full">
      <Link
        href={`${blog.path}`}
        className="grid gap-4 lg:grid-cols-7 lg:gap-8 xl:gap-12 hover:bg-overlay border border-transparent hover:border-overlay p-2 sm:p-4 rounded-xl"
      >
        <div className="relative w-full aspect-[2/1] lg:col-span-3 lg:aspect-[3/2] overflow-auto rounded-lg border">
          <Image
            src={`/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
            fill
            sizes="100%"
            quality={100}
            className="object-cover"
            alt="blog thumbnail"
          />
        </div>
        <div className="flex flex-col space-y-2 lg:col-span-4 xl:justify-center max-w-xl">
          <div className="text-lighter flex space-x-2 text-sm">
            <span>{blog.date}</span>
            <span>•</span>
            <span>{blog.readingTime}</span>
          </div>

          <div>
            <h2 className="h2 lg:!text-2xl xl:!text-3xl !mb-2">{blog.title}</h2>
            <p className="p xl:text-lg">{blog.description}</p>
          </div>

          <div className="flex flex-col w-max gap-2">
            {author.map((author: any, i: number) => {
              return (
                <div className="flex items-center space-x-2" key={i}>
                  {author.author_image_url && (
                    <div className="relative h-6 w-6 overflow-auto">
                      <Image
                        src={author.author_image_url}
                        alt={`${author.author} avatar`}
                        className="rounded-full object-cover"
                        fill
                        sizes="30px"
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-foreground m-0 text-sm">{author.author}</span>
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
