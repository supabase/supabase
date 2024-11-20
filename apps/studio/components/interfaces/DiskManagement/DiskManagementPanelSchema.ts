import { z } from 'zod'
import { DISK_LIMITS, DiskType } from './ui/DiskManagement.constants'

const baseSchema = z.object({
  storageType: z.enum(['io2', 'gp3']).describe('Type of storage: io2 or gp3'),
  totalSize: z
    .number()
    .min(8, { message: 'Allocated disk size must be at least 8 GB.' })
    .describe('Allocated disk size in GB'),
  provisionedIOPS: z.number().describe('Provisioned IOPS for storage type'),
  throughput: z.number().optional().describe('Throughput in MB/s for gp3'),
})

export const getDiskStorageSchema = (currentDiskSize: number) =>
  baseSchema.superRefine((data, ctx) => {
    const { storageType, totalSize, provisionedIOPS, throughput } = data

    if (totalSize < currentDiskSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Disk size cannot be reduced from current configuration',
        path: ['totalSize'],
      })
    }

    if (storageType === 'io2') {
      // Validation rules for io2
      const maxIOPS = Math.min(1000 * totalSize, 256000)
      if (provisionedIOPS < 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provisioned IOPS must be at least 100',
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIOPS) {
        if (totalSize >= 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Provisioned IOPS must be at most ${maxIOPS}.`,
            path: ['provisionedIOPS'],
          })
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid IOPS value due to invalid disk size`,
            path: ['provisionedIOPS'],
          })
        }
      }
      if (throughput !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Throughput is not configurable for io2.',
          path: ['throughput'],
        })
      }
      if (totalSize > DISK_LIMITS[DiskType.IO2].maxStorage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Allocated disk size must not exceed 61,440 GB',
          path: ['totalSize'],
        })
      }
    } else if (storageType === 'gp3') {
      // Validation rules for gp3
      const maxIOPS = Math.min(500 * totalSize, 16000)
      const maxThroughput = Math.min(0.25 * provisionedIOPS, 1000)

      if (provisionedIOPS < 3000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provisioned IOPS must be at least 3000`,
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIOPS) {
        if (totalSize >= 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Provisioned IOPS must be at most ${maxIOPS}`,
            path: ['provisionedIOPS'],
          })
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid IOPS value due to invalid disk size`,
            path: ['provisionedIOPS'],
          })
        }
      }

      if (throughput !== undefined && (throughput < 125 || throughput > maxThroughput)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Throughput must be set between 125 and ${maxThroughput?.toLocaleString()} MB/s.`,
          path: ['throughput'],
        })
      }
      if (totalSize > DISK_LIMITS[DiskType.GP3].maxStorage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Allocated disk size must not exceed 16,384 GB',
          path: ['totalSize'],
        })
      }
    }
  })

export type DiskStorageSchemaType = z.infer<ReturnType<typeof getDiskStorageSchema>>
