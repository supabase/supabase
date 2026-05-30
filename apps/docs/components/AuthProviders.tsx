import { IconPanel } from 'ui-patterns/IconPanel'
import providers from '../data/authProviders'
import Link from 'next/link'

export default function AuthProviders({ type }: { type: string }) {
  const filterProviders = providers.filter((item) => item.authType === type)

  return (
    <>
      <div className="grid grid-cols-12 xs:gap-x-10 gap-y-10 not-prose py-8">
        {filterProviders.map((x) => (
          <Link
            href={`${x.href}`}
            key={x.name}
            passHref
            className="col-span-12 xs:col-span-6 lg:col-span-4 xl:col-span-3"
          >
            <IconPanel title={x.name} icon={x.logo} hasLightIcon={x.hasLightIcon} />
          </Link>
        ))}
      </div>
    </>
  )
}
