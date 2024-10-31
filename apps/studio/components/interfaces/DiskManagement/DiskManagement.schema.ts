import { z } from 'zod'
import {
  calculateDiskSizeRequiredForIopsWithGp3,
  calculateDiskSizeRequiredForIopsWithIo2,
  calculateIopsRequiredForThroughput,
  calculateMaxIopsAllowedForDiskSizeWithGp3,
  calculateMaxIopsAllowedForDiskSizeWithio2,
  formatNumber,
} from './DiskManagement.utils'
import { ComputeInstanceAddonVariantId } from './DiskManagement.types'
import { DISK_LIMITS, DiskType, IOPS_RANGE, THROUGHPUT_RANGE } from './ui/DiskManagement.constants'

const baseSchema = z.object({
  storageType: z.enum(['io2', 'gp3']).describe('Type of storage: io2 or gp3'),
  totalSize: z
    .number()
    .min(8, { message: 'Allocated disk size must be at least 8 GB.' })
    .describe('Allocated disk size in GB'),
  provisionedIOPS: z.number().describe('Provisioned IOPS for storage type'),
  throughput: z.number().optional().describe('Throughput in MB/s for gp3'),
  computeSize: z
    .custom<ComputeInstanceAddonVariantId>((val): val is ComputeInstanceAddonVariantId => true)
    .describe('Compute size'),
})

export const CreateDiskStorageSchema = (defaultTotalSize: number) => {
  const schema = baseSchema.superRefine((data, ctx) => {
    const { storageType, totalSize, provisionedIOPS, throughput, computeSize } = data

    if (totalSize < defaultTotalSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Disk size cannot be reduced in size. Must be at least ${formatNumber(defaultTotalSize)} GB.`,
        path: ['totalSize'],
      })
    }

    if (storageType === 'io2') {
      // Validation rules for io2

      if (provisionedIOPS > IOPS_RANGE[DiskType.IO2].max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IOPS can not exceed ${formatNumber(IOPS_RANGE[DiskType.IO2].max)} for io2 Disk type. Please reach out to support if you need higher IOPS than this.`,
          path: ['provisionedIOPS'],
        })
      }

      const maxIOPSforDiskSizeWithio2 = calculateMaxIopsAllowedForDiskSizeWithio2(totalSize)

      if (provisionedIOPS < IOPS_RANGE[DiskType.IO2].min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provisioned IOPS must be at least ${formatNumber(IOPS_RANGE[DiskType.IO2].min)}`,
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIOPSforDiskSizeWithio2) {
        if (totalSize >= 8) {
          const diskSizeRequiredForIopsWithIo2 =
            calculateDiskSizeRequiredForIopsWithIo2(provisionedIOPS)

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Larger Disk size of at least ${formatNumber(diskSizeRequiredForIopsWithIo2)} GB required. Current max is ${formatNumber(maxIOPSforDiskSizeWithio2)} IOPS.`,
            path: ['provisionedIOPS'],
          })
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid IOPS value due to small disk size`,
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
          message: `Allocated disksize must not exceed ${formatNumber(DISK_LIMITS[DiskType.IO2].maxStorage)} GB `,
          path: ['totalSize'],
        })
      }
    }

    if (storageType === 'gp3') {
      const maxIopsAllowedForDiskSizeWithGp3 = calculateMaxIopsAllowedForDiskSizeWithGp3(totalSize)

      if (provisionedIOPS > IOPS_RANGE[DiskType.GP3].max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IOPS can not exceed ${formatNumber(IOPS_RANGE[DiskType.GP3].max)} for GP3 Disk. Change the Disk type to io2 for higher IOPS support.`,
          path: ['provisionedIOPS'],
        })
      }

      if (provisionedIOPS < IOPS_RANGE[DiskType.GP3].min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IOPS must be at least ${formatNumber(IOPS_RANGE[DiskType.GP3].min)}`,
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIopsAllowedForDiskSizeWithGp3) {
        if (totalSize >= 8) {
          const diskSizeRequiredForIopsWithGp3 =
            calculateDiskSizeRequiredForIopsWithGp3(provisionedIOPS)

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Larger Disk size of at least ${formatNumber(diskSizeRequiredForIopsWithGp3)} GB required. Current max is ${formatNumber(maxIopsAllowedForDiskSizeWithGp3)} IOPS.`,
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
        const maxThroughput = Math.min(0.25 * provisionedIOPS, 1000)

        if (throughput > THROUGHPUT_RANGE['gp3'].max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Throughput can not exceed ${formatNumber(maxThroughput)} MiB/s`,
            path: ['throughput'],
          })
        }
        if (throughput > maxThroughput) {
          const iopsRequiredForThroughput = calculateIopsRequiredForThroughput(throughput)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Need at least ${formatNumber(iopsRequiredForThroughput)} IOPS to support ${formatNumber(throughput)} MiB/s.`,
            path: ['throughput'],
          })
        }
        if (throughput < THROUGHPUT_RANGE[DiskType.GP3].min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Throughput must be at least ${formatNumber(THROUGHPUT_RANGE[DiskType.GP3].min)} MiB/s`,
            path: ['throughput'],
          })
        }
      }

      if (totalSize > DISK_LIMITS[DiskType.GP3].maxStorage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Allocated disksize must not exceed ${formatNumber(DISK_LIMITS[DiskType.GP3].maxStorage)} GB`,
          path: ['totalSize'],
        })
      }
    }
  })

  return schema
}

export type DiskStorageSchemaType = z.infer<ReturnType<typeof CreateDiskStorageSchema>>
