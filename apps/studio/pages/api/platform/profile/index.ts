import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /platform/profile -> our /api/v1/account/profile.
export default bff({
  GET: async (req, res) => {
    const { data: profile, status } = await consoleGet(req, '/api/v1/account/profile')
    if (!profile) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: 'Failed to load profile' } })
    }

    return res.status(200).json({
      id: profile.id,
      gotrue_id: profile.id,
      primary_email: profile.email,
      username: profile.username ?? profile.email,
      first_name: profile.firstName ?? '',
      last_name: profile.lastName ?? '',
      free_project_limit: 100,
      is_alpha_user: false,
      disabled_features: [],
      is_platform_admin: !!profile.isPlatformAdmin,
    })
  },
})
