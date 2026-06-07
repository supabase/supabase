import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] Logical database backups, served from the control plane (pg_dump).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}/backups`)
    return res.status(200).json({
      backups: data?.backups ?? [],
      region: data?.region ?? 'shared',
      walg_enabled: data?.walg_enabled ?? false,
      pitr_enabled: data?.pitr_enabled ?? false,
      physicalBackupData: data?.physicalBackupData ?? {},
      physicalBackupsEnabled: false,
      tierKey: '',
    })
  },
})
