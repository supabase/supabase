function DeploymentBanner() {
  console.log('env', process.env.VERCEL_ENV)
  if (
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local'
  ) {
    const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    const commitMessage = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE
    const pullRequestId = process.env.NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID
    const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF
    const repoUrl = `https://github.com/${process.env.NEXT_PUBLIC_GIT_REPO_OWNER}/${process.env.NEXT_PUBLIC_GIT_REPO_SLUG}`

    return (
      <div className="bg-foreground text-background px-4 py-1 font-mono text-xs flex items-center gap-4">
        <span>
          <strong>Environment:</strong> {process.env.NEXT_PUBLIC_ENVIRONMENT || 'undefined'}
        </span>
        {commitSha && (
          <span>
            <strong>Commit SHA:</strong>{' '}
            <a
              href={`${repoUrl}/commit/${commitSha}`}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {commitSha}
            </a>
          </span>
        )}
        {commitMessage && (
          <span>
            <strong>Commit Message:</strong> {commitMessage}
          </span>
        )}
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

export { DeploymentBanner }
