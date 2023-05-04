import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMenuActiveRefId } from '~/hooks/useMenuState'
import Admonition from '../Admonition'

const OldVersionAlert = () => {
  const router = useRouter()
  const activeRefId = useMenuActiveRefId()

  // Remove the version number from URL to get the latest
  const latestVersionUrl = router.asPath.split('/').slice(0, -2).concat([activeRefId]).join('/')

  return (
    <div className="sticky top-10 z-10 lg:top-14 lg:w-1/2">
      <Admonition type="caution">
        You&apos;re viewing an older version of this library.
        <br />
        <Link href={latestVersionUrl}>
          <a className="underline decoration-brand-700 underline-offset-4 decoration-1">
            Switch to the latest
          </a>
        </Link>
        .
      </Admonition>
    </div>
  )
}

export default OldVersionAlert
