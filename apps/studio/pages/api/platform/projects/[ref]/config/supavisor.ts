import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /platform/projects/{ref}/config/supavisor -> the project's
// shared pooler (Supavisor) config. Transaction pooler is exposed on host :6543;
// the session pooler maps to the project's dbPort. Powers the Connect dialog's
// Transaction/Session pooler tabs.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data: project } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    const conn = project?.connection ?? {}
    const host = conn.host ?? 'localhost'
    const sessionPort = conn.dbPort ?? project?.dbPort
    if (!sessionPort) return res.status(200).json([])

    const transactionPort = 6543
    const user = `postgres.${ref}`
    return res.status(200).json([
      {
        identifier: ref,
        database_type: 'PRIMARY',
        is_using_scram_auth: false,
        db_user: user,
        db_host: host,
        db_port: transactionPort,
        db_name: 'postgres',
        connection_string: `postgresql://${user}:[YOUR-PASSWORD]@${host}:${transactionPort}/postgres`,
        // session pooler port (supavisor session mode), surfaced for the Session tab
        db_port_session: sessionPort,
      },
    ])
  },
})
