'use client'
import { Github, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { Button } from 'ui'

const GithubButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button
      className="border text-sm bg-surface-100 rounded-md px-4 py-2 text-foreground mb-2 flex items-center justify-center gap-x-2"
      type="default"
      htmlType="submit"
      icon={
        pending ? (
          <Loader2 size={18} className="animate-spin w-6 h-6 text-muted" strokeWidth={1.5} />
        ) : (
          <Github size={18} />
        )
      }
    >
      Sign in with Github
    </Button>
  )
}

export default GithubButton
