import { bff, consoleFetch, consoleGet } from '@/lib/console-bff'

function toPlatformProfile(profile: any) {
  return {
    id: profile.id,
    gotrue_id: profile.id,
    primary_email: profile.email,
    username: profile.username ?? profile.email,
    first_name: profile.firstName ?? '',
    last_name: profile.lastName ?? '',
    free_project_limit: 100,
    is_alpha_user: false,
    // No billing anywhere in this product.
    disabled_features: ['billing:all'],
    is_platform_admin: !!profile.isPlatformAdmin,
  }
}

// [console fork] /platform/profile -> our /api/v1/account/profile (GET read, PATCH update).
export default bff({
  GET: async (req, res) => {
    const { data: profile, status } = await consoleGet(req, '/api/v1/account/profile')
    if (!profile) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: 'Failed to load profile' } })
    }
    return res.status(200).json(toPlatformProfile(profile))
  },

  PATCH: async (req, res) => {
    const { first_name, last_name, username } = req.body ?? {}
    const { data, ok, status } = await consoleFetch<any>(req, '/api/v1/account/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName: first_name, lastName: last_name, username }),
    })
    if (!ok || !data) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to update profile' } })
    }
    return res.status(200).json(toPlatformProfile(data))
  },
})
