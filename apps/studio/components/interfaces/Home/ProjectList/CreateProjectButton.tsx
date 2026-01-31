import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from 'ui'
import { IS_PLATFORM } from 'lib/constants'

interface CreateProjectButtonProps {
  organizationSlug?: string
}

export const CreateProjectButton = ({ organizationSlug }: CreateProjectButtonProps) => {
  const [open, setOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const queryClient = useQueryClient()

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/platform/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          organization_id: 1, // Default organization
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create project')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(`Project "${data.name}" created successfully`)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
      setProjectName('')
      // Redirect to the new project
      window.location.href = `/project/${data.ref}`
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast.error('Project name is required')
      return
    }
    createProjectMutation.mutate(projectName)
  }

  // Only show for self-hosted
  if (IS_PLATFORM) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="default" icon={<Plus size={14} />}>
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Create a new project in your self-hosted Supabase instance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My New Project"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="secondary"
            onClick={() => setOpen(false)}
            disabled={createProjectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleCreate}
            loading={createProjectMutation.isPending}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
