import Link from 'next/link'

interface LogVolumeControlHintProps {
  projectRef?: string | null
}

export const LogVolumeControlHint = ({ projectRef }: LogVolumeControlHintProps) => {
  return (
    <p className="text-sm text-foreground-light pr-8">
      Want to reduce log volume and save costs? Find log volume controls in your{' '}
      {projectRef ? (
        <Link
          href={`/project/${projectRef}/settings/general#logs`}
          className="text-foreground underline"
        >
          project settings
        </Link>
      ) : (
        'project settings'
      )}
      .
    </p>
  )
}
