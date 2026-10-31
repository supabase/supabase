import { Award, Zap, MessageCircle, DollarSign, Gift, TrendingUp, LucideIcon } from 'lucide-react'

interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

const benefits: Benefit[] = [
  {
    icon: DollarSign,
    title: 'Paid Contributions',
    description:
      'Top contributors get paid for their efforts. We pay a stipend that recognizes your time and expertise.',
  },
  {
    icon: Award,
    title: 'Community Recognition',
    description:
      'Get a Badge on Discord and flair on Reddit showcasing your SupaSquad status in the community.',
  },
  {
    icon: Zap,
    title: 'Early Access',
    description:
      'Get first access to new Supabase features and provide feedback directly to our team.',
  },
  {
    icon: MessageCircle,
    title: 'Direct Team Access',
    description:
      'Direct communication channel with Supabase team members for questions, suggestions and support.',
  },

  {
    icon: Gift,
    title: 'Exclusive SWAG',
    description:
      'Special Supabase merch reserved for SupaSquad members. Show your status with pride.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Opportunities',
    description:
      'Room to grow from volunteer to paid contributor to paid employee. Your path is up to you.',
  },
]

export function ContributorBenefits() {
  return (
    <div className="grid gap-8 mt-16 border-b border-border py-12">
      <div>
        <h2 className="text-3xl text-foreground mb-4">Benefits for contributors</h2>
        <p className="text-lg text-foreground-lighter">
          Becoming a contributor comes with real benefits. From community recognition to paid
          opportunities, we value your time and impact.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-y-8 gap-x-6">
        {benefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <div key={benefit.title} className="grid gap-3">
              <Icon className="h-6 w-6 text-foreground" />
              <h3 className="text-xl text-foreground">{benefit.title}</h3>
              <p className="text-foreground-lighter">{benefit.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
