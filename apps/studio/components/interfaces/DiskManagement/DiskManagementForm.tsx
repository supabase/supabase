'use client'

import { zodResolver } from '@hookform/resolvers/zod'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button,
  Checkbox_Shadcn_ as Checkbox,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  InfoIcon,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'
import { DiskCountdownRadial } from './DiskCountdownRadial'
import { DiskStorageSchema } from './DiskManagementSchema'

// Define the base schema with Zod

export function DiskManagementForm() {
  const form = useForm<DiskStorageSchema>({
    resolver: zodResolver(DiskStorageSchema),
    defaultValues: {
      storageType: 'Provisioned IOPS SSD (io2)',
      allocatedStorage: 400,
      provisionedIOPS: 3000,
      storageAutoscaling: true,
      maxStorageThreshold: 1000,
      enableDedicatedLogVolume: false,
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const storageType = watch('storageType')
  const allocatedStorage = watch('allocatedStorage')

  useEffect(() => {
    if (storageType === 'Provisioned IOPS SSD (io2)') {
      setValue('allocatedStorage', Math.max(allocatedStorage, 100)) // Ensures min allocated storage is respected
    } else {
      setValue('allocatedStorage', Math.max(allocatedStorage, 20)) // Ensures min allocated storage is respected
    }
  }, [storageType])

  useEffect(() => {
    // Dynamically compute provisionedIOPS based on allocated storage logic
    let calculatedIOPS = 3000
    if (allocatedStorage > 400) {
      calculatedIOPS += Math.floor((allocatedStorage - 400) / 8)
    }
    calculatedIOPS = Math.min(
      calculatedIOPS,
      storageType === 'Provisioned IOPS SSD (io2)' ? 80000 : 16000
    )
    calculatedIOPS = Math.max(
      calculatedIOPS,
      storageType === 'Provisioned IOPS SSD (io2)' ? 1000 : 3000
    )
    setValue('provisionedIOPS', calculatedIOPS)

    // Adjust max storage threshold based on current allocated storage
    const minThreshold = Math.max(allocatedStorage + 2, 22)
    setValue('maxStorageThreshold', minThreshold)
  }, [storageType, allocatedStorage, setValue])

  const onSubmit = (data: DiskStorageSchema) => {
    console.log('Form submitted:', data)
  }

  return (
    <Sheet>
      <SheetTrigger>Open Storage config</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Storage Configuration</SheetTitle>
          <SheetDescription>Configure Disk type, IOPS, and Autoscaling.</SheetDescription>
        </SheetHeader>
        {/* 6 hour warning */}
        <div className="m-5">
          <DiskCountdownRadial />
        </div>
        <Separator />
        {/* Form */}
        <Form_Shadcn_ {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="">
            <SheetSection className="flex flex-col gap-5">
              <FormField_Shadcn_
                name="storageType"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Storage type" description="Select the storage type">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl_Shadcn_>
                        <SelectTrigger id="storageType" className="w-full max-w-96">
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                      </FormControl_Shadcn_>
                      <SelectContent>
                        <SelectItem
                          value="Provisioned IOPS SSD (io2)"
                          className="flex flex-row gap-3"
                        >
                          <div className="flex gap-2 items-center">
                            <span>Provisioned IOPS SSD</span>{' '}
                            <Badge variant={'outline'} className="font-mono">
                              io2
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="General Purpose SSD (gp3)">
                          <div className="flex gap-2 items-center">
                            <span>General Purpose SSD (gp3)</span>{' '}
                            <Badge variant={'outline'} className="font-mono">
                              gp3
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="allocatedStorage"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Allocated storage"
                    description="Minimum: {minAllocatedStorage} GiB. Maximum: {maxAllocatedStorage} GiB"
                  >
                    <div className="flex -space-x-px max-w-48">
                      <FormControl_Shadcn_>
                        <Input
                          id="allocatedStorage"
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="flex-grow rounded-r-none font-mono"
                        />
                      </FormControl_Shadcn_>
                      <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                        <span className="text-foreground-lighter text-xs font-mono">GiB</span>
                      </div>
                    </div>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="provisionedIOPS"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Provisioned IOPS"
                    description=" The minimum value is {minProvisionedIOPS} IOPS and the maximum value is{' '}
                  {maxProvisionedIOPS} IOPS. The IOPS to GiB ratio must be between 0.5 and 1,000"
                  >
                    <div className="flex -space-x-px max-w-48">
                      <FormControl_Shadcn_>
                        <Input
                          id="provisionedIOPS"
                          type="number"
                          className="flex-grow font-mono rounded-r-none"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                        <span className="text-foreground-lighter text-xs font-mono">IOPS</span>
                      </div>
                    </div>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <Separator />

            <SheetSection className="flex flex-col gap-5">
              <h5 className="text-base">Storage autoscaling</h5>
              <FormField_Shadcn_
                name="storageAutoscaling"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex"
                    label="Enable storage autoscaling"
                    description="Enabling this feature will allow the storage to increase after the specified
                  threshold is exceeded."
                  >
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="maxStorageThreshold"
                control={control}
                render={({ field }) => (
                  <FormItemLayout
                    aria-disabled={!form.getValues().storageAutoscaling}
                    label="Maximum storage threshold"
                    description="The minimum value is {minThreshold} GiB and the maximum value is 6,144 GiB"
                  >
                    <div className="flex -space-x-px max-w-48">
                      <FormControl_Shadcn_>
                        <Input
                          id="maxStorageThreshold"
                          type="number"
                          className="flex-grow font-mono rounded-r-none"
                          {...field}
                          disabled={!form.getValues().storageAutoscaling}
                        />
                      </FormControl_Shadcn_>
                      <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                        <span className="text-foreground-lighter text-xs font-mono">GiB</span>
                      </div>
                    </div>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <div className="space-y-2">
                <Label className="text-base">Dedicated Log Volume</Label>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="enableDedicatedLogVolume"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="enableDedicatedLogVolume"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <label
                    htmlFor="enableDedicatedLogVolume"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Turn on Dedicated Log Volume
                  </label>
                </div>
                <p className="text-sm text-foreground-light">
                  Dedicated Log Volumes store database transaction logs on a dedicated volume to
                  improve write performance for latency sensitive workloads. There is additional
                  cost associated with this feature.
                </p>
                <Alert_Shadcn_>
                  <InfoIcon className="w-5 h-5 text-blue-500 mr-2" />
                  <AlertTitle_Shadcn_>
                    We recommend this for larger databases with latency sensitivity.
                  </AlertTitle_Shadcn_>
                </Alert_Shadcn_>
              </div>
            </SheetSection>

            <Button htmlType="submit">Save Changes</Button>
          </form>
        </Form_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}
