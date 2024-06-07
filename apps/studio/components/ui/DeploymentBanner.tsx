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

    return (
      <div className="bg-foreground text-background px-5 py-1 font-mono text-xs">
        <div className="mx-auto flex justify-between items-center">
          <div>
            <span className="mr-4">
              <strong>Environment:</strong> {process.env.NEXT_PUBLIC_ENVIRONMENT || 'undefined'}
            </span>
            {commitSha && (
              <span className="mr-4">
                <strong>Commit SHA:</strong> {commitSha}
              </span>
            )}
            {commitMessage && (
              <span className="mr-4">
                <strong>Commit Message:</strong> {commitMessage}
              </span>
            )}
            {pullRequestId && (
              <span className="mr-4">
                <strong>Pull Request ID:</strong> {pullRequestId}
              </span>
            )}
            {branch && (
              <span className="mr-4">
                <strong>Branch:</strong> {branch}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

export { DeploymentBanner }
