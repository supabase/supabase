import { MDXProvider } from '@mdx-js/react'
import Head from 'next/head'
import { FC, useEffect, useState } from 'react'
import components from '~/components'
import SideBar from '~/components/Navigation/SideBar'
import TableOfContents from '~/components/TableOfContents'

interface Props {
  meta: {
    title: string
    description?: string
    hide_table_of_contents?: boolean
    video?: string
    tocVideo?: string
  }
  children: any
  toc?: any
  menuItems: any
  currentPage: string
}

const Layout: FC<Props> = (props: Props) => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setTimeout(function () {
      setActive(true)
    }, 150)
  }, [])

  // const contentString = renderToString(props.children)

  // const content = serialize(contentString || '')

  // console.log('contentString', contentString)

  // const _toc = toc('#hello world', { maxdepth: 1, firsth1: false })

  const hasTableOfContents =
    props.toc !== undefined &&
    props.toc.json.filter((item) => item.lvl !== 1 && item.lvl <= 3).length > 0

  return (
    <>
      <Head>
        <title>{props.meta?.title} | Supabase</title>
        <meta name="description" content={props.meta?.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/docs/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={props.meta?.title} />
        <meta property="og:description" content={props.meta?.description} />
        <meta property="og:title" content={props.meta?.title} />
      </Head>

      <div
        className={[
          'relative transition-all ease-out',
          'duration-150',
          active ? 'opacity-100 left-0' : 'opacity-0 left-10',
        ].join(' ')}
      >
        <div>
          <p className="text-brand tracking-wider">Tutorials</p>
          <article className={['prose', 'max-w-none'].join(' ')}>
            <h1>{props.meta.title}</h1>
            <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-300 to-brand my-16"></div>

            <MDXProvider components={components} children={props.children} />
          </article>
        </div>
        {hasTableOfContents && !props.meta?.hide_table_of_contents && (
          <div
            className={[
              'border-overlay bg-background table-of-contents-height border-l',
              'thin-scrollbar overflow-y-auto sticky hidden md:block md:col-span-3 px-2',
            ].join(' ')}
          >
            <TableOfContents toc={props.toc} video={props.meta.video} />
          </div>
        )}
      </div>
    </>
  )
}

export default Layout
