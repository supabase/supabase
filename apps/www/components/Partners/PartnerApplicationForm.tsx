import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  TextArea_Shadcn_,
} from 'ui'
import { Alert, AlertDescription } from 'ui/src/components/shadcn/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui/src/components/shadcn/ui/alert-dialog'
import {
  PARTNER_CATEGORIES,
  partnerApplicationSchema,
  type PartnerApplication,
  type LogoUploadResponse,
} from '~/data/partners/partnerApplication.utils'
import { CountrySelector } from '../Supasquad/CountrySelector'
import { useDebounce } from 'use-debounce'
import supabase from '~/lib/supabaseMisc'

interface Props {
  className?: string
}

const PartnerApplicationForm: FC<Props> = ({ className }) => {
  const { resolvedTheme } = useTheme()
  const [honeypot, setHoneypot] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Slug validation state
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const captchaRef = useRef<HCaptcha | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<PartnerApplication>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      contact: {
        first: '',
        last: '',
        email: '',
        company: '',
        country: '',
        website: '',
        phone: '',
        title: '',
        details: '',
      },
      partner: {
        slug: '',
        title: '',
        description: '',
        category: '',
        developer: '',
        logo: '',
        overview: '',
        website: '',
        docs: '',
        video: '',
        call_to_action_link: '',
      },
      captchaToken: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const slugValue = form.watch('partner.slug')
  const [debouncedSlug] = useDebounce(slugValue, 500)

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (!debouncedSlug || debouncedSlug.length < 2) {
        setSlugAvailable(null)
        return
      }

      if (!/^[a-z0-9-]+$/.test(debouncedSlug)) {
        setSlugAvailable(false)
        return
      }

      setIsCheckingSlug(true)
      try {
        const response = await fetch(
          `/api-v2/check-partner-slug?slug=${encodeURIComponent(debouncedSlug)}`
        )
        const data = await response.json()
        setSlugAvailable(data.available)
      } catch {
        setSlugAvailable(null)
      } finally {
        setIsCheckingSlug(false)
      }
    }

    checkSlug()
  }, [debouncedSlug])

  const handleCaptchaVerify = (token: string) => {
    form.setValue('captchaToken', token)
  }

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ logo: 'Please upload a valid image file (JPG, PNG, GIF, WebP, or SVG)' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ logo: 'Logo file must be less than 5MB' })
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setErrors({})
  }, [])

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    form.setValue('partner.logo', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadLogo = async (slug: string): Promise<string | null> => {
    if (!logoFile) return null

    setIsUploadingLogo(true)
    try {
      // Get file extension
      const extension = logoFile.name.split('.').pop()?.toLowerCase() || 'png'

      // Get signed upload URL
      const urlResponse = await fetch('/api-v2/partner-logo-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, fileExtension: extension }),
      })

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const uploadData: LogoUploadResponse = await urlResponse.json()

      // Upload the file using the signed URL
      const uploadResponse = await supabase.storage
        .from('images')
        .uploadToSignedUrl(uploadData.path, uploadData.token, logoFile)

      if (uploadResponse.error) {
        throw uploadResponse.error
      }

      return uploadData.publicUrl
    } catch (error) {
      console.error('Logo upload error:', error)
      throw error
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const onSubmit = async (data: PartnerApplication) => {
    const currentTime = Date.now()
    const timeElapsed = (currentTime - startTime) / 1000

    // Spam prevention: Reject form if submitted too quickly (less than 3 seconds)
    if (timeElapsed < 3) {
      setErrors({ general: 'Submission too fast. Please fill the form correctly.' })
      return
    }

    // Check honeypot
    if (honeypot !== '') {
      setErrors({ general: 'Spam detected.' })
      return
    }

    // Check slug availability one more time
    if (slugAvailable === false) {
      setErrors({ general: 'The slug you chose is not available. Please choose a different one.' })
      return
    }

    // Check if logo file is selected
    if (!logoFile) {
      setErrors({ logo: 'Please upload a logo' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Upload logo if selected
      let logoUrl = data.partner.logo
      if (logoFile) {
        const uploadedUrl = await uploadLogo(data.partner.slug)
        if (uploadedUrl) {
          logoUrl = uploadedUrl
        } else {
          throw new Error('Failed to upload logo')
        }
      }

      // Submit the application
      const response = await fetch('/api-v2/submit-partner-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          partner: {
            ...data.partner,
            logo: logoUrl,
          },
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setShowConfirmation(true)
      } else {
        setErrors({ general: result.message || 'Submission failed. Please try again.' })
        // Reset captcha on error
        captchaRef.current?.resetCaptcha()
        form.setValue('captchaToken', '')
      }
    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      captchaRef.current?.resetCaptcha()
      form.setValue('captchaToken', '')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmationClose = () => {
    form.reset()
    setShowConfirmation(false)
    setErrors({})
    setLogoFile(null)
    setLogoPreview(null)
    setSlugAvailable(null)
    captchaRef.current?.resetCaptcha()
  }

  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  return (
    <>
      <div className={className}>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
            {/* Section 1: Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Contact Information</h3>
                <p className="text-sm text-foreground-lighter mt-1">
                  Tell us about yourself and your company
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="contact.first"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        First Name *
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="John" autoComplete="given-name" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="contact.last"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">Last Name *</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="Doe" autoComplete="family-name" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </div>

              <FormField_Shadcn_
                control={form.control}
                name="contact.email"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">
                      Email Address *
                    </FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        type="email"
                        placeholder="john@company.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="contact.company"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        Company Name *
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          placeholder="Acme Inc"
                          autoComplete="organization"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="contact.title"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">Job Title</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          placeholder="CTO"
                          autoComplete="organization-title"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="contact.country"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">Country *</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <CountrySelector value={field.value} onValueChange={field.onChange} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="contact.phone"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">Phone</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          autoComplete="tel"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </div>

              <FormField_Shadcn_
                control={form.control}
                name="contact.website"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">
                      Company Website *
                    </FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        type="url"
                        placeholder="https://company.com"
                        autoComplete="url"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="contact.details"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">
                      Additional Details
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-foreground-lighter">
                      Anything else you&apos;d like us to know about your company
                    </FormDescription_Shadcn_>
                    <FormControl_Shadcn_>
                      <TextArea_Shadcn_ rows={3} className="bg-foreground/[.026]" {...field} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </div>

            <Separator />

            {/* Section 2: Integration Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Integration Information</h3>
                <p className="text-sm text-foreground-lighter mt-1">
                  Tell us about your integration with Supabase
                </p>
              </div>

              <FormField_Shadcn_
                control={form.control}
                name="partner.slug"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">URL Slug *</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-foreground-lighter">
                      This will be used in the URL: /partners/integrations/your-slug
                    </FormDescription_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative">
                        <Input_Shadcn_
                          placeholder="my-integration"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                            field.onChange(value)
                          }}
                        />
                        {isCheckingSlug && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2
                              className="h-4 w-4 text-foreground-lighter animate-spinner"
                            />
                          </div>
                        )}
                        {!isCheckingSlug && slugAvailable === true && slugValue.length >= 2 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="h-4 w-4 text-brand" />
                          </div>
                        )}
                        {!isCheckingSlug && slugAvailable === false && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                      </div>
                    </FormControl_Shadcn_>
                    {slugAvailable === false && (
                      <p className="text-sm text-destructive mt-1">This slug is already taken</p>
                    )}
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="partner.title"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        Integration Title *
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="My Integration" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="partner.developer"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        Developer/Company Name *
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="Acme Inc" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </div>

              <FormField_Shadcn_
                control={form.control}
                name="partner.category"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">Category *</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="w-full">
                          <SelectValue_Shadcn_ placeholder="Select a category" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {PARTNER_CATEGORIES.map((category) => (
                            <SelectItem_Shadcn_ key={category} value={category}>
                              {category}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="partner.description"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">
                      Short Description *
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-foreground-lighter">
                      A brief description of your integration (max 500 characters)
                    </FormDescription_Shadcn_>
                    <FormControl_Shadcn_>
                      <TextArea_Shadcn_
                        rows={2}
                        className="bg-foreground/[.026]"
                        maxLength={500}
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <p className="text-xs text-foreground-lighter mt-1">
                      {field.value?.length || 0}/500
                    </p>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="partner.overview"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">
                      Full Overview *
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-foreground-lighter">
                      A detailed overview of your integration. Markdown is supported.
                    </FormDescription_Shadcn_>
                    <FormControl_Shadcn_>
                      <TextArea_Shadcn_ rows={6} className="bg-foreground/[.026]" {...field} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="partner.website"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        Integration Website *
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="url"
                          placeholder="https://integration.com"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="partner.docs"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        Documentation URL
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="url"
                          placeholder="https://docs.integration.com"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="partner.video"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">Video URL</FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-foreground-lighter">
                        YouTube video ID or URL
                      </FormDescription_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="dQw4w9WgXcQ" {...field} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="partner.call_to_action_link"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <FormLabel_Shadcn_ className="text-foreground">
                        Call to Action Link
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-foreground-lighter">
                        Link for the &quot;Get Started&quot; button
                      </FormDescription_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="url"
                          placeholder="https://integration.com/signup"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItem_Shadcn_>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 3: Logo Upload */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Logo</h3>
                <p className="text-sm text-foreground-lighter mt-1">
                  Upload your integration logo (JPG, PNG, GIF, WebP, or SVG, max 5MB)
                </p>
              </div>

              <FormField_Shadcn_
                control={form.control}
                name="partner.logo"
                render={() => (
                  <FormItem_Shadcn_>
                    <FormControl_Shadcn_>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                          onChange={handleLogoSelect}
                          className="hidden"
                          id="logo-upload"
                        />

                        {logoPreview ? (
                          <div className="relative w-32 h-32 border border-border rounded-lg overflow-hidden">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-full h-full object-contain bg-background"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground-muted transition-colors"
                          >
                            <Upload className="h-8 w-8 text-foreground-lighter mb-2" />
                            <span className="text-sm text-foreground-lighter">Upload logo</span>
                          </label>
                        )}
                      </div>
                    </FormControl_Shadcn_>
                    {errors.logo && <p className="text-sm text-destructive mt-1">{errors.logo}</p>}
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </div>

            <Separator />

            {/* Captcha */}
            <div className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="captchaToken"
                render={() => (
                  <FormItem_Shadcn_>
                    <FormControl_Shadcn_>
                      <HCaptcha
                        ref={captchaRef}
                        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                        onVerify={handleCaptchaVerify}
                        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </div>

            {/* Error display */}
            {Object.values(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{Object.values(errors).join('\n')}</AlertDescription>
              </Alert>
            )}

            {/* Submit button */}
            <Button
              htmlType="submit"
              size="medium"
              disabled={isSubmitting || isUploadingLogo || slugAvailable === false}
              className="w-full"
              loading={isSubmitting || isUploadingLogo}
            >
              {isSubmitting || isUploadingLogo
                ? isUploadingLogo
                  ? 'Uploading logo...'
                  : 'Submitting...'
                : 'Submit Application'}
            </Button>

            {/* Spam prevention */}
            <input
              type="text"
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </form>
        </Form_Shadcn_>
      </div>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={showConfirmation} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Application Submitted</AlertDialogTitle>
            <AlertDialogDescription>
              Thank you for your partner application! We will review it and get back to you soon.
              Your integration will appear on the marketplace once approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmationClose}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PartnerApplicationForm
