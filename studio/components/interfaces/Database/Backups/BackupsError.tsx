import { IconInfo } from 'ui'
import Link from 'next/link'

const BackupsError = () => {
  return (
    <div className="block w-full rounded border border-gray-400 border-opacity-50 bg-gray-300 p-3">
      <div className="flex space-x-3">
        <IconInfo size={20} strokeWidth={1.5} />
        <p className="text-sm">
          Failed to retrieve backups for this project. Please contact{' '}
          <Link href="/support/new">
            <a className="text-brand-900">support</a>
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default BackupsError
