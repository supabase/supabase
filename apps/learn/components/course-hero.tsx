import { BookA, Clock, GraduationCap } from 'lucide-react'

interface CourseHeroProps {
  title: string
  subtitle: string
  description: string
  stats?: {
    label: string
    icon: React.ReactNode
    accent: string
  }[]
  instructors?: {
    name: string
    icon: React.ReactNode
    accent: string
  }[]
}

export function CourseHero({ title, subtitle, description, instructors }: CourseHeroProps) {
  return (
    <div className="relative w-full mx-auto py-16 sm:py-24 border-b bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.06),_transparent_50%)]">
      {/* Chapter label */}
      <div className="flex items-center justify-center mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Chapter Introduction
        </span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance text-center bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
        {title}
      </h1>

      <p className="text-lg sm:text-xl text-center text-muted-foreground mb-4 text-balance max-w-3xl mx-auto">
        Learn the foundations of Supabase, the Postgres development platform.
      </p>

      <p className="text-sm sm:text-base text-center text-muted-foreground/80 text-pretty max-w-2xl mx-auto">
        In this short course, you'll explore how Supabase brings together Database, Auth, Storage,
        Edge Functions, and Realtime into a unified developer platform.
      </p>

      {/* Course metadata */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
            <BookA />
          </div>
          <span className="font-medium text-muted-foreground">5 Chapters</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
            <Clock />
          </div>
          <span className="font-medium text-muted-foreground">~1 hour</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <GraduationCap />
          </div>
          <span className="font-medium text-muted-foreground">Beginner</span>
        </div>
      </div>
    </div>
  )
}
