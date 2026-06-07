import { bff } from '@/lib/console-bff'

// [console fork] Managed backups not modeled yet on shared infra.
export default bff({
  GET: async (_req, res) =>
    res.status(200).json({
      backups: [],
      region: 'shared',
      walg_enabled: false,
      pitr_enabled: false,
      physicalBackupsEnabled: false,
      tierKey: '',
    }),
})
