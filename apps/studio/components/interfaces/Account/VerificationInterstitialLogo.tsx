import { InterstitialLogoBadge, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

export const VerificationInterstitialLogo = () => (
  <div className="relative">
    <SupabaseLogo />
    <InterstitialLogoBadge className="bg-foreground-muted text-background">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 1.5 3 5v6c0 5.6 3.6 9.6 9 11.5 5.4-1.9 9-5.9 9-11.5V5L12 1.5Zm5.2 7.3a1 1 0 0 0-1.4 0L10.5 14l-2.3-2.2a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l6-6a1 1 0 0 0 0-1.4Z"
        />
      </svg>
    </InterstitialLogoBadge>
  </div>
)
