import { z } from 'zod'
import { DISK_LIMITS, DiskType, THROUGHPUT_RANGE, IOPS_RANGE } from './DiskManagement.constants'
import {
  calculateDiskSizeRequiredForIopsWithGp3,
  calculateDiskSizeRequiredForIopsWithIo2,
  calculateIopsRequiredForThroughput,
  calculateMaxIopsAllowedForDiskSizeWithGp3,
  calculateMaxIopsAllowedForDiskSizeWithio2,
} from './DiskManagement.utils'

const baseSchema = z.object({
  storageType: z.enum(['io2', 'gp3']).describe('Type of storage: io2 or gp3'),
  totalSize: z
    .number()
    .min(8, { message: 'Allocated disk size must be at least 8 GB.' })
    .describe('Allocated disk size in GB'),
  provisionedIOPS: z.number().describe('Provisioned IOPS for storage type'),
  throughput: z.number().optional().describe('Throughput in MB/s for gp3'),
  computeSize: z.string().describe('Compute size'),
})

export const CreateDiskStorageSchema = (defaultTotalSize: number) => {
  const schema = baseSchema.superRefine((data, ctx) => {
    const { storageType, totalSize, provisionedIOPS, throughput, computeSize } = data

    const computeLabel = computeSize.toUpperCase().replace('CI_', '')

    if (totalSize < defaultTotalSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Disk size cannot be reduced in size. Must be at least ${defaultTotalSize} GB.`,
        path: ['totalSize'],
      })
    }

    if (storageType === 'io2') {
      // Validation rules for io2

      if (provisionedIOPS > 256000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'IOPS can not exceed 256,000 for io2 Disk type. Please reach out to support if you need higher IOPS than this.',
          path: ['provisionedIOPS'],
        })
      }

      const maxIOPSforDiskSizeWithio2 = calculateMaxIopsAllowedForDiskSizeWithio2(totalSize)

      if (provisionedIOPS < 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provisioned IOPS must be at least 100',
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIOPSforDiskSizeWithio2) {
        if (totalSize >= 8) {
          const diskSizeRequiredForIopsWithIo2 =
            calculateDiskSizeRequiredForIopsWithIo2(provisionedIOPS)

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Larger Disk size of at least ${diskSizeRequiredForIopsWithIo2}GB required. Current max is ${maxIOPSforDiskSizeWithio2} IOPS.`,
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
          message: 'Allocated disksize must not exceed 61,440 GB',
          path: ['totalSize'],
        })
      }
    }

    if (storageType === 'gp3') {
      const maxIopsAllowedForDiskSizeWithGp3 = calculateMaxIopsAllowedForDiskSizeWithGp3(totalSize)

      if (provisionedIOPS > IOPS_RANGE[DiskType.GP3].max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'IOPS can not exceed 16,000 for GP3 Disk. Change the Disk type to io2 for higher IOPS support.',
          path: ['provisionedIOPS'],
        })
      }

      if (provisionedIOPS < IOPS_RANGE[DiskType.GP3].min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provisioned IOPS must be at least 3000`,
          path: ['provisionedIOPS'],
        })
      } else if (provisionedIOPS > maxIopsAllowedForDiskSizeWithGp3) {
        if (totalSize >= 8) {
          const diskSizeRequiredForIopsWithGp3 =
            calculateDiskSizeRequiredForIopsWithGp3(provisionedIOPS)

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Larger Disk size of at least ${diskSizeRequiredForIopsWithGp3}GB required. Current max is ${maxIopsAllowedForDiskSizeWithGp3} IOPS.`,
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

        if (throughput < THROUGHPUT_RANGE[DiskType.GP3].min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Throughput must be at least 125`,
            path: ['throughput'],
          })
        }
        if (throughput > maxThroughput) {
          const iopsRequiredForThroughput = calculateIopsRequiredForThroughput(throughput)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Need at least ${iopsRequiredForThroughput}IOPS to support ${throughput}MB/s.`,
            path: ['throughput'],
          })
        }
      }

      if (totalSize > DISK_LIMITS[DiskType.GP3].maxStorage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Allocated disksize must not exceed 16,384 GB',
          path: ['totalSize'],
        })
      }
    }

    // const maxIOPSforComputeSize = calculateMaxIopsAllowedForComputeSize(computeSize)

    // // console.log('provisionedIOPS in schame', provisionedIOPS)

    // if (provisionedIOPS > maxIOPSforComputeSize) {
    //   const computeSizeRequiredForIops = calculateComputeSizeRequiredForIops(provisionedIOPS)

    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: `${computeSizeRequiredForIops} Compute size required for this amount of IOPS.`,
    //     path: ['provisionedIOPS'],
    //   })
    // }
  })

  return schema
}

export type DiskStorageSchemaType = z.infer<ReturnType<typeof CreateDiskStorageSchema>>
