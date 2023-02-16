import { MDXProvider } from '@mdx-js/react'
import Head from 'next/head'
import { FC } from 'react'
import components from '~/components'
import TableOfContents from '~/components/TableOfContents'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean; video?: string }
  children: any
  toc?: any
  menuItems: any
}

const Layout: FC<Props> = (props: Props) => {
  const hasTableOfContents =
    props.toc !== undefined &&
    props.toc.json.filter((item) => item.lvl !== 1 && item.lvl <= 3).length > 0

  return (
    <>
      <Head>
        <title>{props.meta?.title} | Supabase Docs</title>
        <meta name="description" content={props.meta?.description} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/docs/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={props.meta?.title} />
        <meta property="og:description" content={props.meta?.description} />
        <meta property="og:title" content={props.meta?.title} />
      </Head>

      <div className={['relative transition-all ease-out', 'duration-150 '].join(' ')}>
        {/* <p className="text-brand-900 tracking-wider">Tutorials</p> */}
        <article className="prose dark:prose-dar max-w-none">
          <h1>{props.meta.title}</h1>
          {/* <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-16"></div> */}
          <MDXProvider components={components} children={props.children} />
        </article>
      </div>
      {hasTableOfContents && !props.meta?.hide_table_of_contents && (
        <div
          className={[
            'border-scale-400 dark:bg-scale-200 table-of-contents-height border-l',
            'thin-scrollbar overflow-y-auto sticky hidden md:block md:col-span-3 px-2',
          ].join(' ')}
        >
          <TableOfContents toc={props.toc} video={props.meta.video} />
        </div>
      )}
    </>
  )
}

export default Layout
