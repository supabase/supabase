import { useEffect } from 'react'

function EnvironmentMetadata() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  const commitMessage = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE
  const pullRequestId = process.env.NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID
  const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF
  const repoOwner = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER
  const repoSlug = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG

  const isPlatform = process.env.NEXT_PUBLIC_IS_PLATFORM

  const repoUrl = `https://github.com/${repoOwner}/${repoSlug}`

  useEffect(() => {
    if ((environment === 'staging' || environment === 'local') && isPlatform) {
      console.log(
        `\n⚡️ ⚡️ ⚡️\n\n%cSupabase Dashboard\n\n%cEnvironment: %c${environment || 'undefined'}\n%cCommit SHA: %c${commitSha ? `${repoUrl}/commit/${commitSha}` : 'undefined'}\n%cCommit Message: %c${commitMessage || 'undefined'}\n%cPull Request ID: %c${pullRequestId ? `${repoUrl}/pull/${pullRequestId}` : 'undefined'}\n%cBranch: %c${branch ? `${repoUrl}/tree/${branch}` : 'undefined'}\n%cRepository: %c${repoOwner || 'undefined'}/${repoSlug || 'undefined'}\n\n`,
        'color: green; font-size: 16px; font-weight: bold;',
        'color: inherit;',
        'color: green;',
        'color: inherit;',
        'color: green;',
        'color: inherit;',
        'color: green;',
        'color: inherit;',
        'color: green;',
        'color: inherit;',
        'color: green;',
        'color: inherit;',
        'color: green;'
      )
    }
  }, [environment, commitSha, commitMessage, pullRequestId, branch, repoOwner, repoSlug])

  if ((environment === 'staging' || environment === 'local') && isPlatform) {
    return (
      <div className="bg-foreground text-background px-4 py-1 font-mono text-xs flex items-center gap-4 w-full top-0 z-50">
        <span>
          <strong>Environment:</strong> {environment || 'undefined'}
        </span>
        {pullRequestId && (
          <span>
            <strong>Pull Request ID:</strong>{' '}
            <a
              href={`${repoUrl}/pull/${pullRequestId}`}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {pullRequestId}
            </a>
          </span>
        )}
        {branch && (
          <span>
            <strong>Branch:</strong>{' '}
            <a
              href={`${repoUrl}/tree/${branch}`}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {branch}
            </a>
          </span>
        )}
      </div>
    )
  } else {
    return null
  }
}

export { EnvironmentMetadata }
