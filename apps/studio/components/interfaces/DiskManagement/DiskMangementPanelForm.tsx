import { zodResolver } from '@hookform/resolvers/zod'
import DiskSpaceBar from 'components/interfaces/DiskManagement/DiskSpaceBar'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_ as Input,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchema } from './DiskManagementSchema'
import { DiskCountdownRadial } from './DiskCountdownRadial'

export function DiskMangementPanelForm() {
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

  const { watch, setValue } = form

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
    <div>
      <FormHeader title="Disk Management" />
      <div className="-space-y-px">
        <DiskCountdownRadial className="rounded-b-none px-2" />
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="bg-surface-100 border flex flex-col gap-8 px-8 py-5">
              <FormField_Shadcn_
                name="storageType"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Storage type"
                    description="Select the storage type"
                    layout="horizontal"
                  >
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
                control={form.control}
                name="provisionedIOPS"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="IOPS"
                    description=" The minimum value is {minProvisionedIOPS} IOPS and the maximum value is{' '}
                  {maxProvisionedIOPS} IOPS."
                    labelOptional="GiB ratio must be between 0.5 and 1,000"
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

              <FormField_Shadcn_
                control={form.control}
                name="provisionedIOPS"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Throughput"
                    description=" The minimum value is {minProvisionedIOPS} IOPS and the maximum value is{' '}
                  {maxProvisionedIOPS} IOPS. GiB ratio must be between 0.5 and 1,000"
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
                        <span className="text-foreground-lighter text-xs font-mono">Mbps</span>
                      </div>
                    </div>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="bg-surface-100 border flex gap-8 px-8 py-5 rounded-t-md">
              <DiskSpaceBar />
            </div>
            {/* <div className="bg-surface-100 rounded-none border flex gap-8"></div> */}

            <Card className="bg-surface-100 rounded-t-none">
              <CardContent className="flex items-center pb-0 py-3 px-8 gap-3">
                <Badge>3 changes detected</Badge>
                <div className="flex gap-2">
                  <Button type="default">Cancel</Button>
                  <Button>Review changes</Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form_Shadcn_>
      </div>
    </div>
  )
}
