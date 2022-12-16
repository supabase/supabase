import { MDXProvider } from '@mdx-js/react'
import Head from 'next/head'
import { FC } from 'react'
import components from '~/components'
import TableOfContents from '~/components/TableOfContents'
import useMousePosition from '~/hooks/useMousePosition'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean; video?: string }
  children: any
  toc?: any
  menuItems: any
}

function CursorBox() {
  const mousePosition = useMousePosition()

  return (
    <div className="mb-20 group relative flex rounded-2xl bg-zinc-50 transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:bg-white/2.5 dark:hover:shadow-black/5 h-48 w-full">
      <div className="pointer-events-none">
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D7EDEA] to-[#F4FBDF] opacity-0 transition duration-300 group-hover:opacity-100 dark:from-[#202D2E] dark:to-[#303428]"
          style={{
            WebkitMaskImage: `radial-gradient(180px at ${mousePosition.x / 2}px ${
              mousePosition.y / 2
            }px, white, transparent)`,
          }}
        ></div>
        <h2 className="pl-8 pt-8">Heading</h2>
        <div
          className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay transition duration-300 group-hover:opacity-100"
          style={{
            WebkitMaskImage: `radial-gradient(180px at ${mousePosition.x / 2}px ${
              mousePosition.y / 2
            }px, white, transparent)`,
          }}
        >
          <svg
            aria-hidden="true"
            className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/50 stroke-black/70 dark:fill-white/2.5 dark:stroke-white/10"
          >
            <defs>
              <pattern
                id=":R1d6hd6:"
                width="72"
                height="56"
                patternUnits="userSpaceOnUse"
                x="50%"
                y="16"
              >
                <path d="M.5 56V.5H72" fill="none"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" stroke-width="0" fill="url(#:R1d6hd6:)"></rect>
            <svg x="50%" y="16" className="overflow-visible">
              <rect stroke-width="0" width="73" height="57" x="0" y="56"></rect>
              <rect stroke-width="0" width="73" height="57" x="72" y="168"></rect>
            </svg>
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-zinc-900/7.5 group-hover:ring-zinc-900/10 dark:ring-white/10 dark:group-hover:ring-white/20"></div>
      <div className="relative rounded-2xl px-4 pt-16 pb-4"></div>
    </div>
  )
}

const Layout: FC<Props> = (props: Props) => {
  const hasTableOfContents =
    props.toc !== undefined &&
    props.toc.json.filter((item) => item.lvl !== 1 && item.lvl <= 3).length > 0

  return (
    <>
      <Head>
        <title>{props.meta?.title} | Supabase</title>
        <meta name="description" content={props.meta?.description} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/docs/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={props.meta?.title} />
        <meta property="og:description" content={props.meta?.description} />
        <meta property="og:title" content={props.meta?.title} />
      </Head>

      <div className="flex gap-8 w-full">
        <CursorBox />
        <CursorBox />
        <CursorBox />
        <CursorBox />
      </div>
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
