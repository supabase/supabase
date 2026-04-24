import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { useAuthBrandingQuery } from '@/data/auth/auth-branding-query'
import { useAuthBrandingUpdateMutation } from '@/data/auth/auth-branding-update-mutation'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { get } from '@/data/fetchers'
import { useBucketCreateMutation } from '@/data/storage/bucket-create-mutation'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'

const BUCKET_NAME = 'email_assets'

interface EmailBrandingSheetProps {
  visible: boolean
  onClose: () => void
}

const BrandingFormSchema = z.object({
  brand_name: z
    .string()
    .max(100, 'Must be 100 characters or fewer')
    .nullable()
    .optional()
    .transform((v) => v || null),
  brand_logo_url: z
    .string()
    .max(2048, 'Must be 2048 characters or fewer')
    .refine((v) => !v || v.startsWith('https://'), { message: 'Must be an https URL' })
    .nullable()
    .optional()
    .transform((v) => v || null),
  brand_color: z
    .string()
    .refine((v) => !v || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v), {
      message: 'Must be a hex color (e.g. #fff or #ffffff)',
    })
    .nullable()
    .optional()
    .transform((v) => v || null),
  brand_footer_text: z
    .string()
    .max(500, 'Must be 500 characters or fewer')
    .nullable()
    .optional()
    .transform((v) => v || null),
})

type BrandingFormValues = z.input<typeof BrandingFormSchema>

function generatePreviewHtml(values: BrandingFormValues): string {
  const accentColor = values.brand_color || '#3ecf8e'
  const name = values.brand_name || 'Your App'
  const footerText = values.brand_footer_text || `© ${new Date().getFullYear()} ${name}`

  const headerContent = values.brand_logo_url
    ? `<img src="${values.brand_logo_url}" alt="${name}" style="max-height:50px;max-width:200px;display:block;margin:0 auto;" />`
    : `<span style="color:#fff;font-size:18px;font-weight:600;">${name}</span>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:20px 12px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1f1f1f;padding:24px;text-align:center;">
      ${headerContent}
    </div>
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Confirm your email address</h2>
      <p style="margin:0 0 24px;color:#4b5563;line-height:1.6;font-size:14px;">Click the button below to confirm your email address. This link will expire in 24 hours.</p>
      <a href="#" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;font-size:14px;">Confirm Email Address</a>
      <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">If you did not create an account, you can safely ignore this email.</p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;color:#6b7280;font-size:12px;">
      ${footerText}
    </div>
  </div>
</body>
</html>`
}

async function bucketExists(projectRef: string): Promise<boolean> {
  const { error } = await get('/platform/storage/{ref}/buckets/{id}', {
    params: { path: { ref: projectRef, id: BUCKET_NAME } },
  })
  return !error
}

export function EmailBrandingSheet({ visible, onClose }: EmailBrandingSheetProps) {
  const { ref: projectRef } = useParams()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const logoUploadRef = useRef<HTMLInputElement>(null)

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showBucketWarning, setShowBucketWarning] = useState(false)

  const { data: clientEndpoint } = useProjectApiUrl({ projectRef })

  const { data: branding, isPending: isLoading } = useAuthBrandingQuery(
    { projectRef },
    { enabled: visible }
  )

  const { mutate: updateBranding, isPending: isSaving } = useAuthBrandingUpdateMutation({
    onSuccess: () => {
      toast.success('Email branding updated')
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to update branding: ${error.message}`)
    },
  })

  const { mutate: createBucket, isPending: isCreatingBucket } = useBucketCreateMutation()

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(BrandingFormSchema),
    defaultValues: {
      brand_name: '',
      brand_logo_url: '',
      brand_color: '',
      brand_footer_text: '',
    },
  })

  useEffect(() => {
    if (branding) {
      form.reset({
        brand_name: branding.brand_name ?? '',
        brand_logo_url: branding.brand_logo_url ?? '',
        brand_color: branding.brand_color ?? '',
        brand_footer_text: branding.brand_footer_text ?? '',
      })
    }
  }, [branding, form])

  const watchedValues = form.watch()
  const previewHtml = useMemo(() => generatePreviewHtml(watchedValues), [watchedValues])

  const uploadFile = async (file: File) => {
    if (!projectRef || !clientEndpoint) return
    setIsUploadingLogo(true)
    try {
      const client = await createProjectSupabaseClient(projectRef, clientEndpoint)
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `logo-${Date.now()}.${ext}`
      const { error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const {
        data: { publicUrl },
      } = client.storage.from(BUCKET_NAME).getPublicUrl(path)
      form.setValue('brand_logo_url', publicUrl, { shouldDirty: true })
    } catch (err) {
      toast.error(`Failed to upload logo: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUploadingLogo(false)
      setPendingFile(null)
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so the same file can be re-selected after a cancel
    e.target.value = ''
    if (!file || !projectRef) return

    const exists = await bucketExists(projectRef)
    if (exists) {
      uploadFile(file)
    } else {
      setPendingFile(file)
      setShowBucketWarning(true)
    }
  }

  const handleConfirmBucketCreate = () => {
    if (!pendingFile || !projectRef) return
    setShowBucketWarning(false)
    createBucket(
      { projectRef, id: BUCKET_NAME, type: 'STANDARD', isPublic: true },
      {
        onSuccess: () => uploadFile(pendingFile),
        onError: (err) => {
          toast.error(`Failed to create bucket: ${err.message}`)
          setPendingFile(null)
        },
      }
    )
  }

  const handleCancelBucketCreate = () => {
    setShowBucketWarning(false)
    setPendingFile(null)
  }

  const onSubmit = (values: BrandingFormValues) => {
    if (!projectRef) return
    updateBranding({ projectRef, branding: values })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      onClose()
    }
  }

  const isWorking = isUploadingLogo || isCreatingBucket

  return (
    <>
      <Sheet open={visible} onOpenChange={handleOpenChange}>
        <SheetContent
          size="lg"
          className="flex flex-col !min-w-screen lg:!min-w-[900px] xl:!min-w-[1080px]"
        >
          <SheetHeader className="py-3">
            <SheetTitle>Customize email branding</SheetTitle>
          </SheetHeader>

          <SheetSection className="flex-1 overflow-y-auto">
            {isLoading ? (
              <GenericSkeletonLoader />
            ) : (
              <div className="flex gap-6 h-full min-h-0">
                {/* Form panel */}
                <div className="flex flex-col gap-6 w-80 shrink-0">
                  <p className="text-sm text-foreground-light">
                    These branding attributes are applied to all default email templates. Set up{' '}
                    <strong>custom SMTP</strong> to edit raw template HTML.
                  </p>

                  <Form_Shadcn_ {...form}>
                    <form
                      id="branding-form"
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="flex flex-col gap-6"
                    >
                      <FormField_Shadcn_
                        control={form.control}
                        name="brand_name"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="vertical"
                            label="Brand name"
                            description="Shown in the email header when no logo is set."
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                value={field.value ?? ''}
                                placeholder="Acme Corp"
                                maxLength={100}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        control={form.control}
                        name="brand_logo_url"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="vertical"
                            label="Logo"
                            description="Displayed in the email header. Max 50px tall."
                          >
                            <FormControl_Shadcn_>
                              <div className="flex flex-col gap-2">
                                <Input_Shadcn_
                                  {...field}
                                  value={field.value ?? ''}
                                  placeholder="https://example.com/logo.png"
                                  type="url"
                                />
                                <div className="flex items-center gap-2 text-foreground-muted">
                                  <div className="flex-1 border-t border-muted" />
                                  <span className="text-xs">or</span>
                                  <div className="flex-1 border-t border-muted" />
                                </div>
                                <Button
                                  type="default"
                                  size="tiny"
                                  icon={<Upload size={12} />}
                                  loading={isWorking}
                                  disabled={isWorking}
                                  onClick={() => logoUploadRef.current?.click()}
                                >
                                  {isWorking ? 'Uploading…' : 'Upload image'}
                                </Button>
                                <input
                                  ref={logoUploadRef}
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleFileSelect}
                                />
                              </div>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        control={form.control}
                        name="brand_color"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="vertical"
                            label="Brand color"
                            description="Hex color used for buttons and accents (e.g. #3ecf8e)."
                          >
                            <FormControl_Shadcn_>
                              <div className="flex items-center gap-2">
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-md border border-control cursor-pointer"
                                    style={{
                                      background: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
                                        field.value ?? ''
                                      )
                                        ? (field.value ?? '#3ecf8e')
                                        : '#3ecf8e',
                                    }}
                                    onClick={() => colorInputRef.current?.click()}
                                  />
                                  <input
                                    ref={colorInputRef}
                                    type="color"
                                    className="sr-only"
                                    value={
                                      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(field.value ?? '')
                                        ? (field.value ?? '#3ecf8e')
                                        : '#3ecf8e'
                                    }
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </div>
                                <Input_Shadcn_
                                  {...field}
                                  value={field.value ?? ''}
                                  placeholder="#3ecf8e"
                                  className="font-mono"
                                  maxLength={7}
                                />
                              </div>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        control={form.control}
                        name="brand_footer_text"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="vertical"
                            label="Footer text"
                            description="Appears at the bottom of every email. Max 500 characters."
                          >
                            <FormControl_Shadcn_>
                              <Textarea
                                {...field}
                                value={field.value ?? ''}
                                placeholder={`© ${new Date().getFullYear()} Acme Corp`}
                                rows={3}
                                maxLength={500}
                                className="resize-none"
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </form>
                  </Form_Shadcn_>
                </div>

                {/* Preview panel */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-foreground-light font-medium uppercase tracking-wide">
                    Preview
                  </p>
                  <div className="flex-1 rounded-lg border border-default overflow-hidden bg-surface-200">
                    <iframe
                      title="Email branding preview"
                      srcDoc={previewHtml}
                      className="w-full h-full min-h-[500px]"
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              </div>
            )}
          </SheetSection>

          <SheetFooter className="flex justify-end gap-2">
            <Button type="default" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              form="branding-form"
              loading={isSaving}
              disabled={isSaving || !form.formState.isDirty}
            >
              Save branding
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={showBucketWarning}
        onOpenChange={(open) => !open && handleCancelBucketCreate()}
      >
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>Create storage bucket</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a public storage bucket named{' '}
              <span className="font-mono font-medium text-foreground">{BUCKET_NAME}</span> in your
              project. Files in this bucket will be publicly accessible via URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBucketCreate}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBucketCreate}>
              Create bucket and upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
