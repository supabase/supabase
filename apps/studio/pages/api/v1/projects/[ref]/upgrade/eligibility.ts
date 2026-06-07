import { bff } from '@/lib/console-bff'

// [console fork] Managed Postgres version upgrades aren't offered on self-host, so
// a project is never "eligible". Return a complete, benign shape (all arrays empty)
// so the upgrade UI renders a clean "no upgrade available" state.
export default bff({
  GET: async (_req, res) =>
    res.status(200).json({
      eligible: false,
      current_app_version: '',
      current_app_version_release_channel: 'ga',
      latest_app_version: '',
      target_upgrade_versions: [],
      potential_breaking_changes: [],
      duration_estimate_hours: 0,
      legacy_auth_custom_roles: [],
      extension_dependent_objects: [],
      objects_to_be_dropped: [],
      unsupported_extensions: [],
      user_defined_objects_in_internal_schemas: [],
    }),
})
