import { FC, useEffect, useState, memo } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormLabel_Shadcn_,
  FormControl_Shadcn_,
  FormItem_Shadcn_,
  Input_Shadcn_,
  FormMessage_Shadcn_,
  Separator,
  TextArea_Shadcn_,
  FormDescription_Shadcn_,
} from 'ui'
import { Alert, AlertDescription } from 'ui/src/components/shadcn/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from 'ui/src/components/shadcn/ui/alert-dialog'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorTrigger,
  MultiSelectorItem,
} from 'ui-patterns/multi-select'
import { CountrySelector } from '../Supasquad/CountrySelector'
import {
  supaSquadApplicationSchema,
  SupaSquadApplication,
} from '~/data/open-source/contributing/supasquad.utils'

interface FormItem_Shadcn_ {
  type: 'text' | 'textarea'
  label: string
  placeholder: string
  required: boolean
  className?: string
  component: typeof TextArea_Shadcn_ | typeof Input_Shadcn_
}

interface Track {
  heading: string
  description: string
}

interface Props {
  className?: string
}

const tracks: Track[] = [
  {
    heading: 'Advocate',
    description: 'Help spread word on socials answer community questions',
  },
  {
    heading: 'Helper',
    description: 'Answer questions and improve docs across our platforms',
  },
  {
    heading: 'Builder/Maintainer',
    description: 'Contribute to client libraries, manage issues, fix bugs',
  },
  {
    heading: 'Moderator',
    description: 'Ensure our social spaces remain productive and helpful',
  },
]

const productAreasOfInterest: string[] = [
  'Auth',
  'AI Builders',
  'Branching',
  'Client libraries',
  'Database / Postgres',
  'Dashboard',
  'CLI',
  'Edge Functions',
  'Integrations',
  'Realtime',
  'Storage',
  'Vectors / AI',
  'Other',
]

const languagesSpoken: string[] = [
  'English',
  'Spanish',
  'Portuguese',
  'French',
  'German',
  'Italian',
  'Russian',
  'Arabic',
  'Hindi',
  'Mandarin Chinese',
  'Japanese',
  'Turkish',
  'Indonesian',
  'Thai',
  'Vietnamese',
  'Bengali',
  'Urdu',
  'Polish',
  'Dutch',
  'Other',
]

const headerContent = {
  title: 'Apply to join SupaSquad',
  description:
    'Join our community of passionate contributors and help shape the future of Supabase. Fill out the form below to apply.',
}

const FormContent = memo(function FormContent({
  form,
  errors,
  onSubmit,
  honeypot,
  setHoneypot,
  isMobile,
  isSubmitted,
  handleCancel,
  isSubmitting,
}: {
  form: ReturnType<typeof useForm<SupaSquadApplication>>
  errors: { [key: string]: string }
  onSubmit: (data: SupaSquadApplication) => Promise<void>
  honeypot: string
  setHoneypot: React.Dispatch<React.SetStateAction<string>>
  isMobile: boolean
  isSubmitted: boolean
  handleCancel: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="flex flex-col">
      <Form_Shadcn_ {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 text-left"
          name="application-form"
          noValidate
        >
          <div className="flex flex-col md:flex-row gap-4 items-start text-left">
            <FormField_Shadcn_
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem_Shadcn_ className="w-full md:flex-1">
                  <FormLabel_Shadcn_ className="text-foreground">First Name *</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      placeholder="Your first name"
                      autoComplete="given-name"
                      {...field}
                    />
                  </FormControl_Shadcn_>

                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem_Shadcn_ className="w-full md:flex-1">
                  <FormLabel_Shadcn_ className="text-foreground">Last Name *</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative ">
                      <Input_Shadcn_
                        placeholder="Your last name"
                        autoComplete="family-name"
                        {...field}
                      />
                    </div>
                  </FormControl_Shadcn_>

                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </div>

          <FormField_Shadcn_
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem_Shadcn_>
                <FormLabel_Shadcn_ className="text-foreground">Email Address *</FormLabel_Shadcn_>
                <FormControl_Shadcn_>
                  <div className="relative">
                    <Input_Shadcn_
                      type="email"
                      placeholder="Your personal or work email"
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl_Shadcn_>
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />

          <Separator />

          <div className="space-y-8">
            <h3 className="h3 text-foreground">Interests and skills</h3>

            <FormField_Shadcn_
              control={form.control}
              name="tracks"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_ className="text-foreground">
                    What track would you like to be considered for? *
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    See longer descriptions of the 4 options above
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <MultiSelector
                        onValuesChange={(values) => {
                          // Convert selected headings back to track objects
                          const selectedTracks = values.map(
                            (heading) => tracks.find((track) => track.heading === heading)!
                          )
                          field.onChange(selectedTracks)
                        }}
                        values={field.value.map((track) => track.heading)}
                        size="small"
                      >
                        <MultiSelectorTrigger
                          mode="inline-combobox"
                          label="Select as many as you want"
                          badgeLimit="wrap"
                          showIcon={false}
                          deletableBadge
                        />
                        <MultiSelectorContent>
                          <MultiSelectorList>
                            {tracks.map((item) => (
                              <MultiSelectorItem key={item.heading} value={item.heading}>
                                <div>
                                  <div className="font-medium text-foreground">{item.heading}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.description}
                                  </div>
                                </div>
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>
                    </div>
                  </FormControl_Shadcn_>

                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="why_you_want_to_join"
              render={({ field }) => (
                <FormItem_Shadcn_ className="space-y-1">
                  <FormLabel_Shadcn_ className="text-foreground">
                    Why do you want to join the program? *
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    What do you have to contribute? What would you like to get out of it?
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative">
                      <TextArea_Shadcn_
                        autoComplete="off"
                        rows={3}
                        className="bg-foreground/[.026]"
                        {...field}
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="contributions"
              render={({ field }) => (
                <FormItem_Shadcn_ className="space-y-1">
                  <FormLabel_Shadcn_ className="text-foreground">
                    Share some of your recent contributions *
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    <p>
                      Any relevant links to show your current engagement with the Supabase
                      community.
                    </p>
                    <p>
                      If you haven&apos;t contributed yet, spend some time engaging with the
                      community, then reapply once you&apos;ve built up a few contributions.
                    </p>
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative">
                      <TextArea_Shadcn_
                        autoComplete="off"
                        rows={3}
                        className="bg-foreground/[.026]"
                        placeholder="PR links, posts/replies on Discord/Reddit/X, Luma links of meetups
                    you have organized, etc."
                        {...field}
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <Separator />
            <FormField_Shadcn_
              control={form.control}
              name="areas_of_interest"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_ className="text-foreground">
                    Product Areas of Interest *
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    What specific areas would you like to help with? Leave blank if you&apos;re not
                    sure.
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <MultiSelector
                        onValuesChange={field.onChange}
                        values={field.value}
                        size="small"
                      >
                        <MultiSelectorTrigger
                          mode="inline-combobox"
                          label="Select as many as you want"
                          badgeLimit="wrap"
                          showIcon={false}
                          deletableBadge
                        />
                        <MultiSelectorContent>
                          <MultiSelectorList>
                            {productAreasOfInterest.map((item) => (
                              <MultiSelectorItem key={item} value={item}>
                                {item}
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_ className="text-foreground">
                    Skills (frameworks, tools, programming languages)
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    Know Postgres really well? React? Expo? Python? Rust? Terraform? Add it here!
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <Input_Shadcn_ type="text" {...field} />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-6">
            <h3 className="h3 text-foreground">Location and Availability</h3>

            <div className="flex flex-col md:flex-row gap-4 items-start text-left">
              <FormField_Shadcn_
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full md:flex-1">
                    <FormLabel_Shadcn_ className="text-foreground">Country *</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <CountrySelector value={field.value || ''} onValueChange={field.onChange} />
                      </div>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full md:flex-1">
                    <FormLabel_Shadcn_ className="text-foreground">City *</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <Input_Shadcn_ type="text" placeholder="City" {...field} />
                      </div>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </div>

            <FormField_Shadcn_
              control={form.control}
              name="monthly_commitment"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_ className="text-foreground">
                    Monthly Commitment
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    How many hours can you commit per month? If not sure, leave blank.
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <Input_Shadcn_ {...field} />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="languages_spoken"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_ className="text-foreground">
                    Languages spoken *
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    What languages do you speak?
                  </FormDescription_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <MultiSelector
                        onValuesChange={field.onChange}
                        values={field.value}
                        size="small"
                      >
                        <MultiSelectorTrigger
                          mode="inline-combobox"
                          label="Select as many as you want"
                          badgeLimit="wrap"
                          showIcon={false}
                          deletableBadge
                        />
                        <MultiSelectorContent>
                          <MultiSelectorList>
                            {languagesSpoken.map((item) => (
                              <MultiSelectorItem key={item} value={item}>
                                {item}
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-6">
            <h3 className="h4 text-foreground">Social Links</h3>

            <div className="space-y-3">
              <FormField_Shadcn_
                control={form.control}
                name="discord"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">Discord</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <Input_Shadcn_ type="text" placeholder="#username" {...field} />
                      </div>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">GitHub</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <Input_Shadcn_ type="text" placeholder="@yourusername" {...field} />
                      </div>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_ className="text-foreground">Twitter</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <Input_Shadcn_ type="text" placeholder="@yourhandle" {...field} />
                      </div>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </div>
          </div>

          {!isSubmitted && (
            <div className="flex flex-row gap-3">
              <Button
                size="small"
                htmlType="button"
                type="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="border-border text-foreground hover:bg-muted flex-1"
              >
                Cancel
              </Button>
              <Button size="small" htmlType="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <>Submitting...</> : <>Submit Application</>}
              </Button>
            </div>
          )}

          {/* Spam prevention */}
          <input
            type="text"
            name="honeypot"
            value={honeypot}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </form>
      </Form_Shadcn_>

      {Object.values(errors).length > 0 && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle />
          <AlertDescription>{Object.values(errors).join('\n')}</AlertDescription>
        </Alert>
      )}
    </div>
  )
})

const ApplyToSupaSquadForm: FC<Props> = ({ className }) => {
  const [honeypot, setHoneypot] = useState<string>('') // field to prevent spam
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)

  const form = useForm<SupaSquadApplication>({
    resolver: zodResolver(supaSquadApplicationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      tracks: [],
      areas_of_interest: [],
      contributions: '',
      skills: '',
      why_you_want_to_join: '',
      city: '',
      country: '',
      monthly_commitment: '',
      languages_spoken: [],
      github: '',
      twitter: '',
      discord: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const handleCancel = () => {
    form.reset()
    setIsSubmitted(false)
  }

  const handleConfirmationClose = () => {
    form.reset()
    setShowConfirmation(false)
    setIsSubmitted(false)
    setErrors({})
  }

  const onSubmit = async (data: SupaSquadApplication) => {
    const currentTime = Date.now()
    const timeElapsed = (currentTime - startTime) / 1000

    // Spam prevention: Reject form if submitted too quickly (less than 3 seconds)
    if (timeElapsed < 3) {
      setErrors({ general: 'Submission too fast. Please fill the form correctly.' })
      return
    }

    setIsSubmitting(true)
    setSuccess(null)

    try {
      const response = await fetch('/api-v2/submit-form-apply-to-supasquad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSuccess('Thank you for your submission!')
        setShowConfirmation(true)
      } else {
        const errorData = await response.json()
        setErrors({ general: `Submission failed: ${errorData.message}` })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  return (
    <>
      <div className={className}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{headerContent.title}</h2>
          <p className="text-muted-foreground">{headerContent.description}</p>
        </div>

        <Separator className="my-6" />

        <FormContent
          form={form}
          errors={errors}
          onSubmit={onSubmit}
          honeypot={honeypot}
          setHoneypot={setHoneypot}
          isMobile={false}
          isSubmitted={isSubmitted}
          handleCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Confirmation AlertDialog Overlay */}
      <AlertDialog open={showConfirmation} onOpenChange={() => {}}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogTitle className="sr-only">Application Submitted</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Your application has been successfully submitted. Please check your email for
            confirmation.
          </AlertDialogDescription>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Thank you for your submission. Please check your email for a confirmation link to
                complete your application.
              </p>
            </div>
            <AlertDialogAction onClick={handleConfirmationClose} className="w-full max-w-xs">
              Got it, thanks!
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ApplyToSupaSquadForm
