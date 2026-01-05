/**
 * Script to authorize Vercel deployments from PR information.
 *
 * Gets the current SHA from environment variable, fetches GitHub statuses,
 * finds authorization-required statuses, and authorizes them via Vercel API.
 */

interface GitHubStatus {
    url: string
    avatar_url: string
    id: number
    node_id: string
    state: 'success' | 'pending' | 'failure' | 'error'
    description: string
    target_url: string
    context: string
    created_at: string
    updated_at: string
  }
  
  interface JobInfo {
    job: {
      headInfo: {
        sha: string
      }
      org: string
      prId: number
      repo: string
    }
  }
  
  async function fetchGitHubStatuses(sha: string): Promise<GitHubStatus[]> {
    const url = `https://api.github.com/repos/supabase/supabase/statuses/${sha}`
    console.log(`Fetching GitHub statuses for SHA: ${sha}`)
  
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub statuses: ${response.status} ${response.statusText}`)
    }
  
    return response.json()
  }
  
  async function extractJobInfoFromTargetUrl(targetUrl: string): Promise<JobInfo> {
    console.log(`Fetching target URL to extract job info: ${targetUrl}`)
  
    const response = await fetch(targetUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch target URL: ${response.status} ${response.statusText}`)
    }
  
    const html = await response.text()
  
    // Try to find JSON data in the page - it might be in a script tag or embedded in the HTML
    // Look for patterns like: __NEXT_DATA__, window.__VERCEL_DATA__, or similar
    const scriptTagMatches = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (scriptTagMatches) {
      try {
        const nextData = JSON.parse(scriptTagMatches[1])
        // Navigate through the Next.js data structure to find job info
        if (nextData?.props?.pageProps?.deployment) {
          const deployment = nextData.props.pageProps.deployment
          if (deployment.gitSource) {
            return {
              job: {
                headInfo: {
                  sha: deployment.gitSource.sha || deployment.gitSource.commitSha,
                },
                org: deployment.target?.team?.slug || deployment.team?.slug || 'supabase',
                prId: deployment.gitSource?.pullRequestNumber || deployment.gitSource?.prNumber,
                repo: deployment.gitSource?.repo || 'supabase',
              },
            }
          }
        }
  
        // Alternative path: check for vercel-specific data
        if (nextData?.props?.pageProps?.job) {
          return nextData.props.pageProps.job
        }
      } catch (e) {
        console.warn('Failed to parse __NEXT_DATA__:', e)
      }
    }
  
    // Try to find window.__VERCEL_DATA__ or similar patterns
    const vercelDataMatch = html.match(/window\.__VERCEL_DATA__\s*=\s*({[\s\S]+?});/)
    if (vercelDataMatch) {
      try {
        const vercelData = JSON.parse(vercelDataMatch[1])
        if (vercelData.job) {
          return vercelData
        }
      } catch (e) {
        console.warn('Failed to parse __VERCEL_DATA__:', e)
      }
    }
  
    // Try to find JSON-LD or other structured data
    const jsonLdMatches = html.match(
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g
    )
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
        try {
          const data = JSON.parse(jsonContent)
          if (data.job) {
            return data
          }
        } catch (e) {
          // Continue searching
        }
      }
    }
  
    throw new Error(
      'Could not extract job info from target URL. The page structure may have changed.'
    )
  }
  
  async function authorizeVercelJob(jobInfo: JobInfo, vercelToken: string): Promise<void> {
    const url = 'https://vercel.com/api/v1/integrations/authorize-job'
    console.log(`Authorizing Vercel job:`, JSON.stringify(jobInfo, null, 2))
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${vercelToken}`,
      },
      body: JSON.stringify(jobInfo),
    })
  
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to authorize Vercel job: ${response.status} ${response.statusText}\n${errorText}`
      )
    }
  
    console.log('✓ Vercel job authorized successfully!')
  }
  
  async function main() {
    const sha = process.env.GITHUB_SHA || process.env.SHA
    if (!sha) {
      throw new Error('GITHUB_SHA or SHA environment variable is required')
    }
  
    const vercelToken = process.env.VERCEL_TOKEN
    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN environment variable is required')
    }
  
    console.log(`Starting authorization process for SHA: ${sha}`)
  
    // Fetch GitHub statuses
    const statuses = await fetchGitHubStatuses(sha)
    console.log(`Found ${statuses.length} statuses`)
  
    // Filter for authorization-required statuses
    const authRequiredStatuses = statuses.filter(
      (status) => status.description === 'Authorization required to deploy.'
    )
  
    if (authRequiredStatuses.length === 0) {
      console.log('No authorization-required statuses found. Nothing to authorize.')
      return
    }
  
    console.log(`Found ${authRequiredStatuses.length} authorization-required status(es)`)
  
    // Process each authorization-required status
    for (const status of authRequiredStatuses) {
      try {
        console.log(`\nProcessing status: ${status.context}`)
        console.log(`Target URL: ${status.target_url}`)
  
        // Extract job info from target URL
        const jobInfo = await extractJobInfoFromTargetUrl(status.target_url)
  
        // Authorize the job
        await authorizeVercelJob(jobInfo, vercelToken)
      } catch (error) {
        console.error(`Failed to process status ${status.context}:`, error)
        // Continue with other statuses even if one fails
      }
    }
  
    console.log('\n✓ Authorization process completed!')
  }
  
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  