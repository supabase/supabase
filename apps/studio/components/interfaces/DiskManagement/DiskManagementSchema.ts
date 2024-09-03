import { z } from 'zod'

const baseSchema = z.object({
  storageType: z.enum(['Provisioned IOPS SSD (io2)', 'General Purpose SSD (gp3)']),
  allocatedStorage: z.number(),
  provisionedIOPS: z.number(),
  storageAutoscaling: z.boolean(),
  maxStorageThreshold: z.number(),
  enableDedicatedLogVolume: z.boolean(),
})

// Refine the schema dynamically based on storageType and allocatedStorage
export const DiskStorageSchema = baseSchema.superRefine((data, ctx) => {
  const { storageType, allocatedStorage } = data

  // Dynamic rules for 'Provisioned IOPS SSD (io2)'
  if (storageType === 'Provisioned IOPS SSD (io2)') {
    if (allocatedStorage < 100 || allocatedStorage > 6144) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Allocated storage must be between 100 and 6144 for Provisioned IOPS SSD (io2).',
        path: ['allocatedStorage'],
      })
    }
    if (data.provisionedIOPS < 1000 || data.provisionedIOPS > 80000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provisioned IOPS must be between 1000 and 80000 for Provisioned IOPS SSD (io2).',
        path: ['provisionedIOPS'],
      })
    }
  } else {
    // Dynamic rules for 'General Purpose SSD (gp3)'
    if (allocatedStorage < 20 || allocatedStorage > 6144) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Allocated storage must be between 20 and 6144 for General Purpose SSD (gp3).',
        path: ['allocatedStorage'],
      })
    }
    if (data.provisionedIOPS < 3000 || data.provisionedIOPS > 16000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provisioned IOPS must be between 3000 and 16000 for General Purpose SSD (gp3).',
        path: ['provisionedIOPS'],
      })
    }
  }

  // Dynamic validation for maxStorageThreshold based on allocatedStorage
  const minThreshold = Math.max(allocatedStorage + 2, 22)
  if (data.maxStorageThreshold < minThreshold || data.maxStorageThreshold > 6144) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Max storage threshold must be between ${minThreshold} and 6144.`,
      path: ['maxStorageThreshold'],
    })
  }
})

export type DiskStorageSchema = z.infer<typeof DiskStorageSchema>
