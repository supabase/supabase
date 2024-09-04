import { zodResolver } from '@hookform/resolvers/zod'
import DiskSpaceBar from 'components/interfaces/DiskManagement/DiskSpaceBar'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogSectionSeparator,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_ as Input,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  Separator,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  Alert_Shadcn_,
  WarningIcon,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
  RadioGroupStacked,
  FormItem_Shadcn_,
  RadioGroupStackedItem,
  RadioGroupCard,
  RadioGroupCardItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchema, DiskStorageSchemaType } from './DiskManagementPanelSchema'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, ArrowRight, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export function DiskMangementPanelForm() {
  const [usedSize, setUsedSize] = useState<number>(4)
  const [totalSize, setTotalSize] = useState<number>(8) // 8 GB total disk size
  const [showTimer, setStateShowTimer] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const form = useForm<DiskStorageSchemaType>({
    resolver: zodResolver(DiskStorageSchema),
    defaultValues: {
      storageType: 'gp3', // Set default values as needed
      allocatedStorage: 8, // Example default
      provisionedIOPS: 3000,
      throughput: 125,
    },
    mode: 'onBlur', // Validation mode
    reValidateMode: 'onChange', // Revalidation mode
  })

  const { watch, setValue, control, formState } = form
  const storageType = watch('storageType')
  const allocatedStorage = watch('allocatedStorage')

  const [mainDiskUsed, setMainDiskUsed] = useState(4) // GB
  const [replicaDiskUsed, setReplicaDiskUsed] = useState(1) // GB
  const mainDiskTotal = totalSize // 75% of total for main disk
  const replicaDiskTotal = totalSize * 1.25 // 25% of total for read replica

  // Watch storageType and allocatedStorage to adjust constraints dynamically
  useEffect(() => {
    if (storageType === 'io2') {
      setValue('throughput', undefined) // Throughput is not configurable for 'io2'
    } else if (storageType === 'gp3') {
      if (allocatedStorage < 400) {
        setValue('throughput', 125) // Fixed throughput for allocated storage < 400 GiB
      } else {
        // Ensure throughput is within the allowed range if it's greater than 400 GiB
        const currentThroughput = form.getValues('throughput')
        if (currentThroughput && (currentThroughput < 125 || currentThroughput > 1000)) {
          setValue('throughput', 125) // Reset to default if out of bounds
        }
      }
    }
  }, [storageType, allocatedStorage, setValue, form])

  const onSubmit = (data) => {
    console.log('Form submitted:', data)
  }

  const showNewBar = allocatedStorage !== totalSize && allocatedStorage > totalSize

  // Destructure dirtyFields from formState
  const { dirtyFields } = formState

  // Check if 'allocatedStorage' is dirty
  const isAllocatedStorageDirty = !!dirtyFields.allocatedStorage

  const calculateDiskSizePrice = () => {
    const newSize = form.getValues('allocatedStorage')
    const oldSize = form.formState.defaultValues?.allocatedStorage || 0
    const pricePerGiB = form.getValues('storageType') === 'io2' ? 0.125 : 0.08
    return ((newSize - Math.max(oldSize, 8)) * pricePerGiB).toFixed(2)
  }

  const calculateIOPSPrice = () => {
    return (form.getValues('provisionedIOPS') * 0.065).toFixed(2)
  }

  const calculateThroughputPrice = () => {
    return (form.getValues('throughput') * 0.04).toFixed(2)
  }

  return (
    <div>
      <FormHeader title="Disk Management" />
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="-space-y-px">
            <Card className="bg-surface-100 rounded-b-none">
              <CardContent className="transition-all duration-500 ease-in-out py-10 flex flex-col gap-10 px-8">
                <FormField_Shadcn_
                  name="storageType"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <FormItemLayout layout="horizontal" label="Storage type">
                        <FormControl_Shadcn_>
                          <RadioGroupCard
                            className="flex flex-wrap gap-3"
                            {...field}
                            onValueChange={async (e) => {
                              field.onChange(e)
                              await form.trigger('provisionedIOPS') // only trigger provisionedIOPS due to other input being hidden
                            }}
                            defaultValue={field.value}
                          >
                            <FormItem_Shadcn_ asChild>
                              <FormControl_Shadcn_>
                                <RadioGroupCardItem
                                  className="grow p-3 px-5"
                                  value="gp3"
                                  showIndicator={false}
                                  // @ts-ignore
                                  label={
                                    <div className="flex flex-col gap-1">
                                      <div className="flex gap-3 items-center">
                                        <span className="text-sm">General Purpose SSD</span>{' '}
                                        <div>
                                          <Badge
                                            variant={'outline'}
                                            className="font-mono bg-alternative bg-opacity-100"
                                          >
                                            gp3
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-foreground-light">
                                        gp3 provides a balance between price and performance
                                      </p>
                                    </div>
                                  }
                                />
                              </FormControl_Shadcn_>
                            </FormItem_Shadcn_>
                            <FormItem_Shadcn_ asChild>
                              <FormControl_Shadcn_>
                                <RadioGroupCardItem
                                  className="grow p-3 px-5"
                                  value="io2"
                                  showIndicator={false}
                                  // @ts-ignore
                                  label={
                                    <div className="flex flex-col gap-1">
                                      <div className="flex gap-3 items-center">
                                        <span className="text-sm">Provisioned IOPS SSD</span>{' '}
                                        <div>
                                          <Badge
                                            variant={'outline'}
                                            className="font-mono bg-alternative bg-opacity-100"
                                          >
                                            io2
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-foreground-light">
                                        `io2` offers high IOPS for mission-critical applications.
                                      </p>
                                    </div>
                                  }
                                />
                              </FormControl_Shadcn_>
                            </FormItem_Shadcn_>
                          </RadioGroupCard>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    </>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name="provisionedIOPS"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="IOPS"
                      description={
                        storageType === 'io2'
                          ? 'For `io2` storage type, 3000 IOPS and the maximum value is 16,000 IOPS.'
                          : 'For `gp3` storage type, 100 IOPS and the maximum value is 256,000 IOPS.'
                      }
                      //   labelOptional="GiB ratio must be between 0.5 and 1,000"
                      labelOptional="Input/output operations per second. Higher IOPS is suitable for applications requiring high throughput."
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex -space-x-px">
                          <FormControl_Shadcn_>
                            <Input
                              id="provisionedIOPS"
                              type="number"
                              className="flex-grow font-mono rounded-r-none max-w-32"
                              {...field}
                              onChange={(e) => {
                                setValue('provisionedIOPS', e.target.valueAsNumber, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }}
                            />
                          </FormControl_Shadcn_>
                          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                            <span className="text-foreground-lighter text-xs font-mono">IOPS</span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {(storageType === 'io2' ||
                            (storageType === 'gp3' && field.value > 3000)) &&
                            !formState.errors.provisionedIOPS && (
                              <motion.div
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -4 }}
                                transition={{ duration: 0.15 }}
                              >
                                <Badge variant="default" className="bg-alternative bg-opacity-100">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-mono text-foreground-muted">
                                      ${calculateIOPSPrice()}
                                    </span>
                                    <ChevronRight
                                      size={12}
                                      strokeWidth={2}
                                      className="text-foreground-muted"
                                    />
                                    <span className="text-xs font-mono text-foreground">
                                      ${calculateIOPSPrice()}
                                    </span>
                                  </div>
                                </Badge>
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                    </FormItemLayout>
                  )}
                />
                <AnimatePresence initial={false}>
                  {form.getValues('storageType') === 'gp3' && (
                    <motion.div
                      key="throughPutContainer"
                      initial={{ opacity: 0, x: -4, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -4, height: 0 }}
                      transition={{ duration: 0.1 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <FormField_Shadcn_
                        name="throughput"
                        control={control}
                        render={({ field }) => (
                          <FormItemLayout
                            label="Throughput (MiBps)"
                            layout="horizontal"
                            description={
                              'Throughput can only be configured when Disk size is greater than 400 GiB.'
                            }
                          >
                            <div className="flex gap-3 items-center">
                              <div className="flex -space-x-px">
                                <FormControl_Shadcn_>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => {
                                      setValue('throughput', e.target.valueAsNumber, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                    }}
                                    className="flex-grow font-mono rounded-r-none max-w-32"
                                    disabled={storageType === 'io2' || allocatedStorage < 400} // Disable if storageType is 'io2' or allocatedStorage < 400
                                  />
                                </FormControl_Shadcn_>
                                <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                                  <span className="text-foreground-lighter text-xs font-mono">
                                    MiBps
                                  </span>
                                </div>
                              </div>
                              <AnimatePresence>
                                {formState.isDirty &&
                                formState.dirtyFields.throughput &&
                                !formState.errors.throughput ? (
                                  <motion.div
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -4 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <Badge
                                      variant="default"
                                      className="bg-alternative bg-opacity-100"
                                    >
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-mono text-foreground-muted">
                                          ${calculateThroughputPrice()}
                                        </span>
                                        <ChevronRight
                                          size={12}
                                          strokeWidth={2}
                                          className="text-foreground-muted"
                                        />
                                        <span className="text-xs font-mono text-foreground">
                                          ${calculateThroughputPrice()}
                                        </span>
                                      </div>
                                    </Badge>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          </FormItemLayout>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              <Separator />
              <CardContent className="py-10 px-8">
                <FormField_Shadcn_
                  name="allocatedStorage"
                  control={control}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Disk Size"
                      layout="horizontal"
                      description={
                        <>
                          <>
                            Additional GiB: ${storageType === 'io2' ? '0.125' : '0.08'}
                            /month after 8 GB
                          </>
                          {form.getValues('allocatedStorage') > totalSize && (
                            <>
                              . Total additional cost: $
                              {(
                                (form.getValues('allocatedStorage') - totalSize) *
                                (storageType === 'io2' ? 0.125 : 0.08)
                              ).toFixed(2)}{' '}
                              per month
                            </>
                          )}
                        </>
                      }
                    >
                      <div className="mt-1 relative flex gap-2 items-center">
                        <div className="flex -space-x-px max-w-48">
                          <FormControl_Shadcn_>
                            <Input
                              type="number"
                              step="1"
                              {...field}
                              className="flex-grow font-mono rounded-r-none"
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => {
                                setValue('allocatedStorage', e.target.valueAsNumber, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }}
                            />
                          </FormControl_Shadcn_>
                          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                            <span className="text-foreground-lighter text-xs font-mono">GiBs</span>
                          </div>
                        </div>
                        <AnimatePresence initial={false}>
                          {isAllocatedStorageDirty && (
                            <motion.div
                              key="throughPutContainer"
                              initial={{ opacity: 0, scale: 0.95, x: -2 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, x: -2 }}
                              transition={{ duration: 0.15 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <Button
                                htmlType="button"
                                type="default"
                                size="small"
                                onClick={() => {
                                  form.resetField('allocatedStorage')
                                }}
                              >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {formState.isDirty &&
                          formState.dirtyFields.allocatedStorage &&
                          !formState.errors.allocatedStorage ? (
                            <motion.div
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Badge variant="default" className="bg-alternative bg-opacity-100">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-mono text-foreground-muted">
                                    ${calculateDiskSizePrice()}
                                  </span>
                                  <ChevronRight
                                    size={12}
                                    strokeWidth={2}
                                    className="text-foreground-muted"
                                  />
                                  <span className="text-xs font-mono text-foreground">
                                    ${calculateDiskSizePrice()}
                                  </span>
                                </div>
                              </Badge>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </FormItemLayout>
                  )}
                />
                <div className="grid grid-cols-12 gap-3">
                  {/* You can add additional content in the remaining 4 columns if needed */}
                  <div className="col-span-4">
                    {/* Additional content or information can go here */}
                  </div>
                  <div className="col-span-8">
                    <div className="col-span-8">
                      <div className="space-y-6 mt-6">
                        <div>
                          <h3 className="text-sm">Main Disk Space</h3>
                          <DiskSpaceBar
                            showNewBar={showNewBar}
                            totalSize={mainDiskTotal}
                            usedSize={mainDiskUsed}
                            newTotalSize={
                              form.getValues('allocatedStorage') <= totalSize
                                ? mainDiskTotal
                                : form.getValues('allocatedStorage')
                            }
                          />
                        </div>
                        <div>
                          <h3 className="text-sm">Read Replica Disk Space</h3>
                          <DiskSpaceBar
                            showNewBar={showNewBar}
                            totalSize={mainDiskTotal * 1.25}
                            usedSize={mainDiskUsed}
                            newTotalSize={
                              form.getValues('allocatedStorage') <= totalSize
                                ? replicaDiskTotal
                                : form.getValues('allocatedStorage') * 1.25
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* <div className="bg-surface-100 rounded-none border flex gap-8"></div> */}

            <AnimatePresence>
              {showTimer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DiskCountdownRadial
                    className="px-2 rounded-none"
                    setShowTimer={setStateShowTimer}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* <AnimatePresence>
              {Object.keys(formState.dirtyFields).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.12, delay: 0.1 }}
                >
                  <Alert_Shadcn_
                    variant="default"
                    className="bg-studio rounded-none pl-10 [&_svg]:left-8"
                  >
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      Disk configuration changes will cause billing changes
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      You can review the changes and accept them to apply them.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </motion.div>
              )}
            </AnimatePresence> */}

            <Card className="bg-surface-100 rounded-t-none">
              <CardContent className="flex items-center pb-0 py-3 px-8 gap-3 justify-end">
                <AnimatePresence mode="wait">
                  {Object.keys(formState.dirtyFields).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          transition: { duration: 0.3 },
                        }}
                      >
                        <Badge variant={'default'}>
                          <motion.span
                            key={Object.keys(formState.dirtyFields).length}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.1 }}
                          >
                            {Object.keys(formState.dirtyFields).length === 1
                              ? '1 change to review'
                              : `${Object.keys(formState.dirtyFields).length} changes to review`}
                          </motion.span>
                        </Badge>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  <Button
                    type="default"
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty}
                  >
                    Cancel
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        htmlType="submit"
                        type={'primary'}
                        onClick={async (e) => {
                          e.preventDefault()
                          const isValid = await form.trigger() // Triggers validation for all fields
                          if (isValid) {
                            setIsDialogOpen(true) // Open the dialog only if the form is valid
                          } else {
                            console.log('Form validation failed. Please check the fields.')
                          }
                        }}
                        disabled={!form.formState.isDirty}
                      >
                        Review changes
                      </Button>
                    </DialogTrigger>
                    <DialogContent size="large">
                      <DialogHeader>
                        <DialogTitle>Review changes</DialogTitle>
                        <DialogDescription>
                          Disk configuration changes will take effect after the next restart.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogSectionSeparator />

                      <Table>
                        <TableCaption>Please take note of the above billing changes</TableCaption>
                        <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
                          <TableRow>
                            <TableHead className="w-[200px] pl-5">Disk attribute</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right pr-5">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
                          <TableRow>
                            <TableCell className="font-medium pl-5">Disk Size</TableCell>
                            <TableCell>
                              <div className="flex justify-start">
                                <Badge
                                  size="large"
                                  className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
                                >
                                  <span className="font-mono text-foreground-muted">
                                    {form.formState.defaultValues?.allocatedStorage}GiB
                                  </span>
                                  <ChevronRight size={12} className="text-foreground-muted" />
                                  <span className="font-mono text-foreground">
                                    {form.getValues('allocatedStorage')}GiB
                                  </span>
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <div className="flex justify-end">
                                <Badge
                                  size="large"
                                  className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
                                >
                                  <span className="font-mono text-foreground-muted">$0.00</span>
                                  <ChevronRight size={12} className="text-foreground-muted" />
                                  <span className="font-mono text-foreground">
                                    ${calculateDiskSizePrice()}
                                  </span>
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium pl-5">IOPS</TableCell>
                            <TableCell>
                              <div className="flex justify-start">
                                <Badge
                                  size="large"
                                  className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
                                >
                                  <span className="font-mono text-foreground-muted">
                                    {form.formState.defaultValues?.provisionedIOPS}IOPS
                                  </span>
                                  <ChevronRight size={12} className="text-foreground-muted" />
                                  <span className="font-mono text-foreground">
                                    {form.getValues('provisionedIOPS')}IOPS
                                  </span>
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <div className="flex justify-end">
                                <Badge
                                  size="large"
                                  className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
                                >
                                  <span className="font-mono text-foreground-muted">$0.00</span>
                                  <ChevronRight size={12} className="text-foreground-muted" />
                                  <span className="font-mono text-foreground">
                                    ${calculateIOPSPrice()}
                                  </span>
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium pl-5">Throughput</TableCell>
                            <TableCell>
                              <div className="flex justify-start">
                                <Badge
                                  size="large"
                                  className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
                                >
                                  <span className="font-mono text-foreground-muted">
                                    {form.formState.defaultValues?.throughput}MiBps
                                  </span>
                                  <ChevronRight size={12} className="text-foreground-muted" />
                                  <span className="font-mono text-foreground">
                                    {form.getValues('throughput')}MiBps
                                  </span>
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <div className="flex justify-end">
                                <Badge
                                  size="large"
                                  className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
                                >
                                  <span className="font-mono text-foreground-muted">$0.00</span>
                                  <ChevronRight size={12} className="text-foreground-muted" />
                                  <span className="font-mono text-foreground">
                                    ${calculateThroughputPrice()}
                                  </span>
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>

                      <DialogSection>Warning here about the 6 hour thing</DialogSection>

                      <DialogSectionSeparator />

                      <DialogSection className="bg-surface-100 text-sm text-foreground-light">
                        <p>Disk configuration changes will take effect after the next restart.</p>
                      </DialogSection>

                      <DialogFooter>
                        <Button
                          block
                          size="small"
                          type="default"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          block
                          size="small"
                          htmlType="submit"
                          loading={loading}
                          onClick={async () => {
                            // Simulating a 5 second delay

                            setLoading(true)
                            await new Promise((resolve) => setTimeout(resolve, 3000))
                            setLoading(false)

                            form.reset()
                            // Close the dialog after the delay
                            setIsDialogOpen(false)
                            setStateShowTimer(true)
                          }}
                        >
                          Accept changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form_Shadcn_>
    </div>
  )
}
