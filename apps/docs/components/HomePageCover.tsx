import Link from 'next/link'
import { IconBackground, IconPanel, IconPlay } from 'ui'
import { useBreakpoint } from 'common'
import DocsCoverLogo from './DocsCoverLogo'

const HomePageCover = (props) => {
  const isXs = useBreakpoint(639)
  const iconSize = isXs ? 'sm' : 'lg'

  const GettingStarted = () => (
    <div
      className="
        border border-scale-400 bg-scale-200
        relative overflow-hidden
        grid grid-cols-12
        rounded-lg
        p-5 md:p-8
        "
    >
      <div className="col-span-full flex flex-col md:flex-row xl:flex-col justify-between gap-1 md:gap-3">
        <div className="md:max-w-xs xl:max-w-none">
          <div className="flex items-center gap-3 mb-3">
            <IconBackground>
              <IconPlay className="text-brand-1100 dark:text-brand-900 w-4" />
            </IconBackground>
            <h3 className="text-2xl m-0">Getting Started</h3>
          </div>
          <p className="text-scale-1100 text-sm">
            Discover how to set up a database to an app making queries in just a few minutes.
          </p>
        </div>
        <div className="flex flex-wrap md:grid md:grid-cols-4 2xl:grid-cols-7 gap-2 sm:gap-3">
          <Link href={`/guides/getting-started/quickstarts/reactjs`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="ReactJS"
                icon="/docs/img/icons/react-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/nextjs`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="NextJS"
                icon="/docs/img/icons/nextjs-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/redwoodjs`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="RedwoodJS"
                icon="/docs/img/icons/redwoodjs-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/flutter`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="Flutter"
                icon="/docs/img/icons/flutter-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/kotlin`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="Kotlin"
                icon="/docs/img/icons/kotlin-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/sveltekit`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="SvelteKit"
                icon="/docs/img/icons/svelte-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/solidjs`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="SolidJS"
                icon="/docs/img/icons/solidjs-icon"
              />
            </a>
          </Link>
          <Link href={`/guides/getting-started/quickstarts/vue`} passHref>
            <a className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip="Vue"
                icon="/docs/img/icons/vuejs-icon"
              />
            </a>
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full bg-scale-100 border-b prose dark:prose-dar max-w-none mb-16 md:mb-12 xl:mb-0">
      <div className="max-w-7xl px-5 mx-auto py-8 sm:pb-16 sm:pt-12 xl:pt-16 flex flex-col xl:flex-row justify-between gap-12 xl:gap-12">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center w-full max-w-xl">
          <DocsCoverLogo />
          <div className="flex flex-col">
            <h1 className="m-0 mb-3 text-2xl sm:text-3xl">{props.meta?.title}</h1>
            <p className="m-0 text-scale-1100">
              Learn how to get up and running with Supabase through tutorials, APIs and platform
              resources.
            </p>
          </div>
        </div>
        <div className="w-full xl:max-w-[365px] 2xl:max-w-[608px] -mb-40">
          <GettingStarted />
        </div>
      </div>
    </div>
  )
}

export default HomePageCover
