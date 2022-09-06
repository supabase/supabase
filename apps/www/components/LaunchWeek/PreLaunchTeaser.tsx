import { NewspaperIcon } from '@heroicons/react/outline'
import { Button } from '@supabase/ui'
import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'

export function PreLaunchTeaser() {
  const authorArray = ['paul_copplestone', 'ant_wilson']
  const author = []

  for (let i = 0; i < authorArray.length; i++) {
    author.push(
      // @ts-ignore
      authors.find((authors: string) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-12 gap-8 md:gap-16">
        <div className="relative col-span-12 drop-shadow-lg lg:col-span-8">
          <img
            className="z-10 w-full rounded-xl border"
            src="/images/launchweek/launchweek-day-placeholder.jpg"
            alt="Supabase"
          />
          <iframe
            className="absolute top-0 w-full rounded-xl"
            height="100%"
            src="https://www.youtube-nocookie.com/embed/4t_63HT3rZY"
            style={{ top: 0, left: 0 }}
            frameBorder="0"
            allow="autoplay; modestbranding; encrypted-media"
          ></iframe>
        </div>
        <div
          className="
            col-span-12
            grid
            grid-cols-1
            gap-8

            md:grid
            md:grid-cols-2
            md:gap-16

            lg:col-span-4 
            lg:flex
            lg:flex-col
            lg:justify-between
        "
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              {author.map((author: any) => {
                return (
                  <Image
                    key={author.author_id + ' profile image'}
                    src={author.author_image_url}
                    className="dark:border-dark rounded-lg border"
                    width="54px"
                    height="54px"
                  />
                )
              })}
            </div>
            <div className="flex flex-col">
              <h4 className="text-scale-1200 text-base">Founders Fireside Chat</h4>
              <p className="text-scale-1100 text-sm">
                Our two co-founders, Copple and Ant, discuss open source development and the future
                of Supabase.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-scale-1100 w-8">
              <NewspaperIcon strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-scale-1200 text-base">Supabase Series B</h3>
              <p className="text-scale-1100 text-sm">
                Supabase raised $80M in May, bringing our total funding to $116M.
              </p>
            </div>
            <div>
              <Link href="/blog/supabase-series-b">
                <Button type="default">Read more</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreLaunchTeaser
