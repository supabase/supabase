import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ReactTooltip from 'react-tooltip'

const frameworks = [
  {
    name: 'nextjs',
    icon: '/images/logos/frameworks/nextjs.svg',
    docs: '/docs/guides/getting-started/quickstarts/nextjs',
  },
  {
    name: 'react',
    icon: '/images/logos/frameworks/react.svg',
    docs: '/docs/guides/getting-started/quickstarts/reactjs',
  },
  {
    name: 'nuxtjs',
    icon: '/images/logos/frameworks/nuxtjs.svg',
    docs: '/docs/guides/getting-started/quickstarts/nuxtjs',
  },
  {
    name: 'flutter',
    icon: '/images/logos/frameworks/flutter.svg',
    docs: '/docs/guides/getting-started/quickstarts/flutter',
  },
  {
    name: 'svelte',
    icon: '/images/logos/frameworks/svelte.svg',
    docs: '/docs/guides/getting-started/quickstarts/sveltekit',
  },
  {
    name: 'expo',
    icon: '/images/logos/frameworks/expo.svg',
    docs: '/docs/guides/getting-started/tutorials/with-expo',
  },
  {
    name: 'vue',
    icon: '/images/logos/frameworks/vue.svg',
    docs: '/docs/guides/getting-started/quickstarts/vue',
  },
]

const FrontendFrameworks = ({ className }: { className?: string }) => {
  return (
    <div className={['flex text-center flex-col items-center', className].join(' ')}>
      <small className="small">Works seamlessly with +20 frameworks</small>
      <div className="w-full sm:max-w-lg mt-4 md:mt-3 lg:ml-0">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          {frameworks.map((framework) => (
            <Link href={framework.docs}>
              <a key={framework.name} className="m-0" data-tip={framework.name}>
                <Image
                  key={framework.name}
                  className="opacity-80 hover:opacity-100"
                  src={framework.icon}
                  alt={framework.name}
                  width={40}
                  height={40}
                />
              </a>
            </Link>
          ))}
          <ReactTooltip effect={'solid'} place="bottom" className="!py-2 !px-4" />
        </div>
      </div>
    </div>
  )
}

export default FrontendFrameworks
