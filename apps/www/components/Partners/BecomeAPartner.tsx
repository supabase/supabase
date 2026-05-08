import PartnerIntakeForm from './PartnerIntakeForm'

export default function BecomeAPartner() {
  return (
    <div className="border-t bg-alternative">
      <div
        id="become-a-partner"
        className="mx-auto max-w-3xl flex flex-col gap-10 py-24 px-6 md:py-32"
      >
        <div className="flex flex-col items-center gap-4 text-center text-balance">
          <h2 className="text-3xl md:text-4xl tracking-tight">Become a Supabase Partner</h2>
          <p className="text-foreground-light text-lg max-w-xl">
            Tell us about your company and the program you’re interested in. Our team reviews every
            application and will reach out if there’s a good fit.
          </p>
        </div>
        <PartnerIntakeForm />
      </div>
    </div>
  )
}
