import { bff } from '@/lib/console-bff'

// [console fork] Project storage config for the Storage settings page. Defaults for
// shared infra (50 MB upload limit, image transformation + S3 protocol available).
const DEFAULT = {
  fileSizeLimit: 52428800,
  features: {
    imageTransformation: { enabled: true },
    s3Protocol: { enabled: true },
    icebergCatalog: { enabled: false },
  },
}

export default bff({
  GET: async (_req, res) => res.status(200).json(DEFAULT),
  PATCH: async (req, res) => res.status(200).json({ ...DEFAULT, ...(req.body ?? {}) }),
})
