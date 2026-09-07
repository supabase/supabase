'use client'

import { useState } from 'react'
import { Button, Input, Label } from 'ui'

export default function DisabledNativeForm() {
  const [name, setName] = useState('')

  return (
    <form
      className="flex max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-project"
        />
      </div>
      <Button type="submit" disabled={name.trim().length === 0}>
        Create project
      </Button>
    </form>
  )
}
