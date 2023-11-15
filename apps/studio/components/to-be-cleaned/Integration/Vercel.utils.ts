import { post, get } from 'lib/common/fetch'
import { INTEGRATION_ENVS_ALIAS } from 'lib/vercelConfigs'
import { Dictionary } from 'components/grid'
import { API_URL } from 'lib/constants'

export async function fetchVercelProjects({
  vercelTeamId,
  vercelToken,
}: {
  vercelTeamId?: string
  vercelToken: string
}): Promise<{ data?: Dictionary<any>[]; error?: string }> {
  let url = `${API_URL}/vercel/projects`
  if (vercelTeamId && vercelTeamId != 'null') {
    const query = new URLSearchParams({ teamId: vercelTeamId }).toString()
    url = `${url}?${query}`
  }
  const response = await get(url, {
    headers: { vercel_authorization: `Bearer ${vercelToken}` },
  })
  if (response.error != null) {
    return { error: `Retrieve vercel projects failed. ${response.error?.message}` }
  }
  return { data: response }
}

/**
 * /v6/projects/:id returns project alias with domain info.
 * We need this to setup Supabase Auth site url on project creation.
 *
 * Do not update to /v8/projects/:id as it doesn't return alias info
 */
export async function fetchVercelProject({
  id,
  vercelTeamId,
  vercelToken,
}: {
  id: string
  vercelTeamId?: string
  vercelToken: string
}): Promise<{ data?: Dictionary<any>; error?: string }> {
  let url = `${API_URL}/vercel/projects`
  if (vercelTeamId && vercelTeamId != 'null') {
    const query = new URLSearchParams({ id, teamId: vercelTeamId }).toString()
    url = `${url}?${query}`
  } else {
    const query = new URLSearchParams({ id }).toString()
    url = `${url}?${query}`
  }
  const data = await get(url, {
    headers: { vercel_authorization: `Bearer ${vercelToken}` },
  })
  if (data.error != null) {
    return { error: `Retrieve vercel project failed. ${data.error.message}` }
  }
  return { data }
}

export async function fetchVercelProjectEnvs({
  id,
  vercelTeamId,
  vercelToken,
}: {
  id: string
  vercelTeamId?: string
  vercelToken: string
}): Promise<{ data?: Dictionary<any>[]; error?: string }> {
  let url = `${API_URL}/vercel/projects/envs`
  if (vercelTeamId && vercelTeamId != 'null') {
    const query = new URLSearchParams({ projectId: id, teamId: vercelTeamId }).toString()
    url = `${url}?${query}`
  } else {
    const query = new URLSearchParams({ projectId: id }).toString()
    url = `${url}?${query}`
  }
  const response = await get(url, {
    headers: { vercel_authorization: `Bearer ${vercelToken}` },
  })
  if (response.error != null) {
    return { error: `Retrieve vercel project envs failed. ${response.error?.message}` }
  }
  return { data: response }
}

export async function createVercelEnv({
  key,
  value,
  type,
  target,
  vercelProjectId,
  vercelTeamId,
  vercelToken,
}: {
  key: string
  value: string
  type: 'encrypted' | string
  target: ('production' | 'development' | 'preview')[]
  vercelProjectId: string
  vercelTeamId?: string
  vercelToken: string
}) {
  let url = `${API_URL}/vercel/projects/envs`
  if (vercelTeamId && vercelTeamId != 'null') {
    const query = new URLSearchParams({
      projectId: vercelProjectId,
      teamId: vercelTeamId,
    }).toString()
    url = `${url}?${query}`
  } else {
    const query = new URLSearchParams({ projectId: vercelProjectId }).toString()
    url = `${url}?${query}`
  }
  return await post(
    url,
    { key, value, type, target },
    {
      headers: { vercel_authorization: `Bearer ${vercelToken}` },
    }
  )
}

export function prepareVercelEvns(
  requiredEnvs: {
    key: string
    alias: string
    type: 'encrypted' | string
  }[],
  project: {
    db_host?: string
    db_password?: string
    endpoint: string
    anon_key: string
    service_key: string
  }
) {
  const envs: any = []

  requiredEnvs.forEach((x) => {
    let env: {
      key: string
      value: string
      type: 'encrypted' | string
      target: ('production' | 'development' | 'preview')[]
    } = { key: x.key, type: x.type, target: ['production', 'development', 'preview'], value: '' }

    switch (x.alias) {
      case INTEGRATION_ENVS_ALIAS.ENDPOINT:
        env.value = project.endpoint
        break
      case INTEGRATION_ENVS_ALIAS.ANONKEY:
        env.value = project.anon_key
        break
      case INTEGRATION_ENVS_ALIAS.SERVICEKEY:
        env.value = project.service_key
        break
      case INTEGRATION_ENVS_ALIAS.DBHOST:
        env.value = project.db_host ?? ''
        break
      case INTEGRATION_ENVS_ALIAS.DBPASSWORD:
        env.value = project.db_password ?? ''
        break
    }

    envs.push(env)
  })

  return envs
}
