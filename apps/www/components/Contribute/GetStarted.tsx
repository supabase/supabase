import Link from 'next/link'
import { Lightbulb, MessageCircle, BookOpen, Award, ArrowRight } from 'lucide-react'
import { Button, Card, CardContent } from 'ui'

const steps = [
  {
    number: 1,
    icon: Lightbulb,
    title: 'Find a Thread',
    description: 'Browse questions below from Discord, Reddit, and GitHub.',
  },
  {
    number: 2,
    icon: MessageCircle,
    title: 'Share Knowledge',
    description: 'Click through and provide a helpful, detailed solution.',
  },
  {
    number: 3,
    icon: Award,
    title: 'Earn Recognition',
    description: 'Active contributors get featured and earn community badges.',
  },
]

export function GetStarted() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}

      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl md:text-2l text-foreground">Not sure where to start?</h2>
        <p className="text-lg text-foreground">
          Contributing is easy! Here&apos;s how you can help the community today.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {steps.map((step) => {
          return (
            <Card key={step.number} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Number Badge and Icon */}
                  <div className="flex items-center gap-4">
                    <step.icon className="h-6 w-6 text-brand" />
                  </div>

                  {/* Title and Description */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Leaderboard CTA */}
      <div className="mt-10 flex justify-center">
        <Button asChild type="default" iconRight={<ArrowRight className="h-4 w-4" />}>
          <Link href="/contribute/leaderboard">Browse the helper leaderboard</Link>
        </Button>
      </div>
    </section>
  )
}
