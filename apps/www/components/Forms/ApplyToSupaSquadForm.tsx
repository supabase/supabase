import { FC, useEffect, useState, memo } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import * as z from "zod";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Form_Shadcn_, FormField_Shadcn_, FormLabel_Shadcn_, FormControl_Shadcn_, FormItem_Shadcn_, Input_Shadcn_, FormMessage_Shadcn_, Separator, TextArea_Shadcn_, FormDescription_Shadcn_ } from 'ui'
import {
  Alert,
  AlertTitle,
  AlertDescription
} from 'ui/src/components/shadcn/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "ui/src/components/shadcn/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/src/components/shadcn/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "ui/src/components/shadcn/ui/drawer";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorTrigger,
  MultiSelectorItem,
} from 'ui-patterns/multi-select'

interface FormItem_Shadcn_ {
  type: 'text' | 'textarea'
  label: string
  placeholder: string
  required: boolean
  className?: string
  component: typeof TextArea_Shadcn_ | typeof Input_Shadcn_
}

interface Props {
  className?: string
  trigger: React.ReactNode;
}

const tracks = [
  "Helper",
  "Moderator",
  "Builder/Maintainer",
  "Advocate"
]

const productAreasOfInterest: string[] = [
  "Auth",
  "Branching",
  "Client libraries",
  "Database / Postgres",
  "Dashboard",
  "CLI",
  "Edge Functions",
  "Integrations",
  "Realtime",
  "Storage",
  "Vectors / AI",
  "Other",
];

const languagesSpoken: string[] = [
  "English",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Italian",
  "Russian",
  "Arabic",
  "Hindi",
  "Mandarin Chinese",
  "Japanese",
  "Turkish",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Bengali",
  "Urdu",
  "Polish",
  "Dutch",
  "Other",
];

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  tracks: z.array(z.string()).min(1, "Select at least 1 track"),
  areas_of_interest: z.array(z.string()).min(1, "Select at least 1 area of interest"),
  why_you_want_to_join: z.string().min(1, "This is required"),
  monthly_commitment: z.string().min(1, "This is required"),
  languages_spoken: z.array(z.string()).min(1, "Select at least 1 language"),
  skills: z.string().min(1, "This is required"),
  location: z.string().min(1, "Make sure to specify your city and country"),
  github: z.string().optional(),
  twitter: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const headerContent = {
  title: "Apply to join SupaSquad",
  description:
    "Join our community of passionate contributors and help shape the future of Supabase. Fill out the form below to apply.",
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
  isSubmitting
}: {
  form: ReturnType<typeof useForm<ApplicationFormData>>
  errors: { [key: string]: string }
  onSubmit: (data: ApplicationFormData) => Promise<void>
  honeypot: string
  setHoneypot: React.Dispatch<React.SetStateAction<string>>
  isMobile: boolean
  isSubmitted: boolean
  handleCancel: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="flex flex-col">
      {Object.values(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {Object.values(errors).join('\n')}
          </AlertDescription>
        </Alert>
      )}

      <Form_Shadcn_ {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          name="application-form"
          noValidate
        >
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <FormField_Shadcn_
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem_Shadcn_ className="w-full md:flex-1">
                  <FormLabel_Shadcn_>First Name *</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      placeholder="Your first name"
                      // autoFocus={!isMobile}
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
              name="lastName"
              render={({ field }) => (
                <FormItem_Shadcn_ className="w-full md:flex-1">
                  <FormLabel_Shadcn_>Last Name *</FormLabel_Shadcn_>
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
                <FormLabel_Shadcn_>Email Address *</FormLabel_Shadcn_>
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

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Interest and skills</h3>
            <FormField_Shadcn_
              control={form.control}
              name="why_you_want_to_join"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Why do you want to join the program? *</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative">
                      <TextArea_Shadcn_
                        autoComplete="off"
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
              name="tracks"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>What track would you like to be considered for?</FormLabel_Shadcn_>
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
                            {tracks.map((item) => (
                              <MultiSelectorItem
                                key={item}
                                value={item}
                              >
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
              name="areas_of_interest"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Product Areas of Interest</FormLabel_Shadcn_>
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
                              <MultiSelectorItem
                                key={item}
                                value={item}
                              >
                                {item}
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>
                      <FormDescription_Shadcn_>
                        What specific areas would you like to help with?
                      </FormDescription_Shadcn_>
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
                  <FormLabel_Shadcn_>Skills (frameworks, tools, programming languages)</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <Input_Shadcn_
                        type="text"
                        {...field}
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                  <FormDescription_Shadcn_>
                    Know Postgres really well?  React? Python? Rust? Terraform? Add it here!
                  </FormDescription_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
          </div>


          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Location and Availability</h3>
            <FormField_Shadcn_
              control={form.control}
              name="monthly_commitment"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Monthly Commitment</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <Input_Shadcn_
                        type="text"
                        {...field}
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                  <FormDescription_Shadcn_>
                    How many hours can you commit per month?
                  </FormDescription_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>City, Country</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="relative mt-1">
                      <Input_Shadcn_
                        type="text"
                        placeholder="City, Country"
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
              name="languages_spoken"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Languages spoken</FormLabel_Shadcn_>
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
                              <MultiSelectorItem
                                key={item}
                                value={item}
                              >
                                {item}
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>
                      <FormDescription_Shadcn_>
                        What specific areas would you like to help with?
                      </FormDescription_Shadcn_>
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Social Links</h3>

            <div className="space-y-3">
              <FormField_Shadcn_
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_>GitHub</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <Input_Shadcn_
                          type="text"
                          placeholder="@yourusername"
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
                name="twitter"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormLabel_Shadcn_>Twitter</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <div className="relative mt-1">
                        <Input_Shadcn_
                          type="text"
                          placeholder="@yourhandle"
                          {...field}
                        />
                      </div>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
            </div>
          </div>

          {!isSubmitted && !isMobile && (
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
              <Button
                size="small"
                htmlType="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                  </>
                )}
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
    </div>
  )
})

const ApplyToSupaSquadForm: FC<Props> = ({ className, trigger }) => {
  const [honeypot, setHoneypot] = useState<string>('') // field to prevent spam
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [startTime, setStartTime] = useState<number>(0)
  const [isMobile, setIsMobile] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      tracks: [],
      areas_of_interest: [],
      skills: "",
      why_you_want_to_join: "",
      location: "",
      languages_spoken: [],
      github: "",
      twitter: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const handleCancel = () => {
    setIsOpen(false);
    form.reset();
    setIsSubmitted(false);
    // setShowConfirmation(false);
    // setSubmitError(null);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setIsOpen(false);
    form.reset();
    setIsSubmitted(false);
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsSubmitted(false); 954 - 3
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent
            className={`flex flex-col max-h-[80vh] transition-transform duration-300 ${showConfirmation ? "scale-95 opacity-50" : ""
              }`}
          >
            <div className="overflow-y-auto flex-1 px-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>{headerContent.title}</DrawerTitle>
                <DrawerDescription className="text-muted-foreground">
                  {headerContent.description}
                </DrawerDescription>
              </DrawerHeader>
              <Separator className="my-4" />
              <div className="px-0 pb-20">
                < FormContent
                  form={form}
                  errors={errors}
                  onSubmit={onSubmit}
                  honeypot={honeypot}
                  setHoneypot={setHoneypot}
                  isMobile={isMobile}
                  isSubmitted={isSubmitted}
                  handleCancel={handleCancel}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
            {!isSubmitted && (
              <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex gap-3">
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
                <Button
                  size="small"
                  htmlType="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isSubmitting ? (
                    <>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Mobile Confirmation Drawer Overlay */}
        <Drawer open={showConfirmation} onOpenChange={() => { }}>
          <DrawerContent className="z-[60]">
            <div className="flex flex-col items-center gap-6 py-8 px-6">
              <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold">
                  Application Submitted!
                </h3>
                <p className="text-muted-foreground">
                  Thank you for your submission. Please check your email for a
                  confirmation link to complete your application.
                </p>
              </div>
              <Button
                onClick={handleConfirmationClose}
                className="w-full max-w-xs mt-4"
              >
                Got it, thanks!
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className={`transition-all duration-300 ${showConfirmation ? "scale-95 opacity-50" : ""
            }`}
        >
          <DialogHeader>
            <DialogTitle className="">{headerContent.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {headerContent.description}
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          <div className='p-6'>
            < FormContent
              form={form}
              errors={errors}
              onSubmit={onSubmit}
              honeypot={honeypot}
              setHoneypot={setHoneypot}
              isMobile={isMobile}
              isSubmitted={isSubmitted}
              handleCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog Overlay */}
      <AlertDialog open={showConfirmation} onOpenChange={() => { }}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogTitle className="sr-only">
            Application Submitted
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Your application has been successfully submitted. Please check your
            email for confirmation.
          </AlertDialogDescription>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Thank you for your submission. Please check your email for a
                confirmation link to complete your application.
              </p>
            </div>
            <AlertDialogAction
              onClick={handleConfirmationClose}
              className="w-full max-w-xs"
            >
              Got it, thanks!
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ApplyToSupaSquadForm

