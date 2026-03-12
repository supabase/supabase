import { CloudProvider, COMPUTE_MAX_IOPS, computeInstanceAddonVariantIdSchema } from 'shared-data'
import { z } from 'zod'
import {
  calculateDiskSizeRequiredForIopsWithGp3,
  calculateDiskSizeRequiredForIopsWithIo2,
  calculateIopsRequiredForThroughput,
  calculateMaxThroughput,
  calculateMaxIopsAllowedForDiskSizeWithGp3,
  calculateMaxIopsAllowedForDiskSizeWithio2,
  formatNumber,
} from './DiskManagement.utils'
import { DISK_LIMITS, DiskType } from './ui/DiskManagement.constants'
import { COMPUTE_MAX_THROUGHPUT } from 'shared-data'

const baseSchema = z.object({
  storageType: z.enum(['io2', 'gp3']).describe('Type of storage: io2 or gp3'),
  totalSize: z.number().int('Value must be an integer').describe('Allocated disk size in GB'),
  provisionedIOPS: z.number().describe('Provisioned IOPS for storage type'),
  throughput: z.number().optional().describe('Throughput in MB/s for gp3'),
  computeSize: computeInstanceAddonVariantIdSchema
    .describe('Compute size')
    .optional()
    .default('ci_micro'),
  growthPercent: z
    .number()
    .int('Value must be an integer')
    .min(10, 'Growth percent must be at least 10%')
    .max(100, 'Growth percent cannot exceed 100%')
    .optional()
    .nullable(),
  minIncrementGb: z
    .number()
    .int('Value must be an integer')
    .min(1, 'Minimum increment must be at least 1 GB')
    .max(200, 'Minimum increment cannot exceed 200 GB')
    .optional()
    .nullable(),
  maxSizeGb: z
    .number()
    .int('Value must be an integer')
    .max(60000, 'Maximum size cannot exceed 60TB')
    .optional()
    .nullable(),
})

export const CreateDiskStorageSchema = ({
  defaultTotalSize,
  cloudProvider,
}: {
  defaultTotalSize: number
  cloudProvider: CloudProvider
}) => {
  const isFlyProject = cloudProvider === 'FLY'
  const isAwsNimbusProject = cloudProvider === 'AWS_NIMBUS'
  const isAwsK8sProject = cloudProvider === 'AWS_K8S'

  const validateDiskConfiguration = !isFlyProject && !isAwsNimbusProject && !isAwsK8sProject

  const schema = baseSchema.superRefine((data, ctx) => {
    const { storageType, totalSize, provisionedIOPS, throughput, maxSizeGb, computeSize } = data
    const computeMaxIops = (() => {
      const parsedCompute = computeInstanceAddonVariantIdSchema.safeParse(computeSize)
      if (!parsedCompute.success) return Number.POSITIVE_INFINITY
      return COMPUTE_MAX_IOPS[parsedCompute.data] ?? Number.POSITIVE_INFINITY
    })()

    if (validateDiskConfiguration && totalSize < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Allocated disk size must be at least 8 GB.',
        path: ['totalSize'],
      })
    }

    if (validateDiskConfiguration && totalSize < defaultTotalSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Disk size cannot be reduced in size. Reduce your database size and then head to the Infrastructure settings and go through a Postgres version upgrade to right-size your disk.`,
        path: ['totalSize'],
      })
    }

    // Validate maxSizeGb cannot be lower than totalSize
    if (validateDiskConfiguration && !!maxSizeGb && maxSizeGb < totalSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Max disk size cannot be lower than the current disk size. Must be at least ${formatNumber(totalSize)} GB.`,
        path: ['maxSizeGb'],
      })
    }

    if (validateDiskConfiguration && storageType === 'io2') {
      // Validation rules for io2

      const maxIopsForIo2 = Math.min(DISK_LIMITS[DiskType.IO2].maxIops, computeMaxIops)
      if (provisionedIOPS > maxIopsForIo2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IOPS cannot exceed ${formatNumber(maxIopsForIo2)} for io2 Disk type and the selected compute size.`,
          path: ['provisionedIOPS'],
        })
      }

      const maxIOPSforDiskSizeWithio2 = calculateMaxIopsAllowedForDiskSizeWithio2(totalSize)

      if (provisionedIOPS < DISK_LIMITS[DiskType.IO2].minIops) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provisioned IOPS must be at least ${formatNumber(DISK_LIMITS[DiskType.IO2].minIops)}`,
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIOPSforDiskSizeWithio2) {
        if (totalSize >= 8) {
          const diskSizeRequiredForIopsWithIo2 =
            calculateDiskSizeRequiredForIopsWithIo2(provisionedIOPS)

          if (diskSizeRequiredForIopsWithIo2 > totalSize) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Larger Disk size of at least ${formatNumber(diskSizeRequiredForIopsWithIo2)} GB required. Current max is ${formatNumber(maxIOPSforDiskSizeWithio2)} IOPS.`,
              path: ['provisionedIOPS'],
            })
          }
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

    if (validateDiskConfiguration && storageType === 'gp3') {
      const maxIopsAllowedForDiskSizeWithGp3 = calculateMaxIopsAllowedForDiskSizeWithGp3(totalSize)
      const maxIopsForGp3 = Math.min(DISK_LIMITS[DiskType.GP3].maxIops, computeMaxIops)
      const computeMaxThroughput = (() => {
        const parsedCompute = computeInstanceAddonVariantIdSchema.safeParse(computeSize)
        if (!parsedCompute.success) return DISK_LIMITS[DiskType.GP3].maxThroughput
        return COMPUTE_MAX_THROUGHPUT[parsedCompute.data] ?? DISK_LIMITS[DiskType.GP3].maxThroughput
      })()

      if (provisionedIOPS > maxIopsForGp3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IOPS cannot exceed ${formatNumber(maxIopsForGp3)} for GP3 Disk and the selected compute size.`,
          path: ['provisionedIOPS'],
        })
      }

      if (provisionedIOPS < DISK_LIMITS[DiskType.GP3].minIops) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IOPS must be at least ${formatNumber(DISK_LIMITS[DiskType.GP3].minIops)}`,
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
        // gp3 throughput scales with provisioned IOPS (capped by gp3 max)
        const iopsThroughputLimit = calculateMaxThroughput(provisionedIOPS)
        if (throughput > DISK_LIMITS[DiskType.GP3].maxThroughput) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Throughput cannot exceed ${formatNumber(DISK_LIMITS[DiskType.GP3].maxThroughput)} MB/s for GP3 disk type.`,
            path: ['throughput'],
          })
        } else if (throughput > computeMaxThroughput) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Throughput cannot exceed ${formatNumber(computeMaxThroughput)} MB/s for the selected compute size.`,
            path: ['throughput'],
          })
        } else if (throughput > iopsThroughputLimit) {
          const iopsRequiredForThroughput = calculateIopsRequiredForThroughput(throughput)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Need at least ${formatNumber(iopsRequiredForThroughput)} IOPS to support ${formatNumber(throughput)} MB/s.`,
            path: ['throughput'],
          })
        }
        if (throughput < DISK_LIMITS[DiskType.GP3].minThroughput) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Throughput must be at least ${formatNumber(DISK_LIMITS[DiskType.GP3].minThroughput)} MB/s`,
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
