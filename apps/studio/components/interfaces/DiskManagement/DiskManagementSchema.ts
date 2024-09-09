import { z } from 'zod'
import { DISK_LIMITS, DiskType, DISK_TYPE_LABELS } from './DiskMangement.constants'

const baseSchema = z.object({
  storageType: z.enum([DiskType.IO2, DiskType.GP3]),
  allocatedStorage: z.number(),
  provisionedIOPS: z.number(),
  throughput: z.number().optional(),
  storageAutoscaling: z.boolean(),
  maxStorageThreshold: z.number(),
  enableDedicatedLogVolume: z.boolean(),
})

export const DiskStorageSchema = baseSchema.superRefine((data, ctx) => {
  const limits = DISK_LIMITS[data.storageType]

  if (data.allocatedStorage < limits.minStorage || data.allocatedStorage > limits.maxStorage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Allocated storage must be between ${limits.minStorage} and ${limits.maxStorage} for ${DISK_TYPE_LABELS[data.storageType]}.`,
      path: ['allocatedStorage'],
    })
  }

  if (data.provisionedIOPS < limits.minIops || data.provisionedIOPS > limits.maxIops) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Provisioned IOPS must be between ${limits.minIops} and ${limits.maxIops} for ${DISK_TYPE_LABELS[data.storageType]}.`,
      path: ['provisionedIOPS'],
    })
  }

  if (data.storageType === DiskType.IO2) {
    if (data.throughput !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Throughput is not configurable for io2.',
        path: ['throughput'],
      })
    }
  } else if (data.storageType === DiskType.GP3) {
    if (data.allocatedStorage < 400 && data.throughput !== limits.includedThroughput) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Throughput must be ${limits.includedThroughput} MiBps for allocated storage less than 400 GiB for gp3.`,
        path: ['throughput'],
      })
    } else if (
      data.allocatedStorage >= 400 &&
      data.throughput !== undefined &&
      (data.throughput < limits.minThroughput || data.throughput > limits.maxThroughput)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Throughput must be set between ${limits.minThroughput} and ${limits.maxThroughput} MiBps.`,
        path: ['throughput'],
      })
    }
  }

  // Dynamic validation for maxStorageThreshold based on allocatedStorage
  const minThreshold = Math.max(data.allocatedStorage + 2, 22)
  if (data.maxStorageThreshold < minThreshold || data.maxStorageThreshold > limits.maxStorage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Max storage threshold must be between ${minThreshold} and ${limits.maxStorage}.`,
      path: ['maxStorageThreshold'],
    })
  }
})

export type DiskStorageSchema = z.infer<typeof DiskStorageSchema>
