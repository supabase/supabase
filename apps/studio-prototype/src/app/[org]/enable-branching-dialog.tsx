'use client'

import { useConfig } from '@/src/hooks/use-config'
import { X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

export default function EnableBranchingDialog() {
  const [config, setConfig] = useConfig()
  const [open, setOpenState] = useState(false)
  const { selectedEnv, selectedOrg, selectedProject } = config
  return (
    <Dialog open={open} onOpenChange={setOpenState}>
      <DialogTrigger asChild>
        <Button type="default">Enable Branching</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Enable branching</DialogTitle>
          <DialogDescription>Some description</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-foreground-light text-sm">Turn on Github</p>
          <p className="text-foreground-light text-sm">Turn on Github</p>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-foreground-light text-sm">Turn on Vercel</p>
          <p className="text-foreground-light text-sm">Turn on Vercel</p>
        </DialogSection>
        <DialogFooter>
          <Button
            size="medium"
            block
            onClick={() => {
              console.log('Branching enabled')

              /**
               * HACKY LOCAL DB STORE STUFF
               */
              let updatedDbValues = config.db

              // update db with new values for project
              updatedDbValues = {
                ...updatedDbValues,
                orgs: updatedDbValues.orgs.map((org) => {
                  if (org.key === selectedOrg?.key) {
                    return {
                      ...org,
                      projects: org.projects.map((project) => {
                        if (project.key === selectedProject?.key) {
                          return {
                            ...project,
                            branching: true,
                            branches: [
                              {
                                name: 'main',
                                type: 'prod',
                                key: 'main',
                              },
                            ],
                          }
                        }
                        return project
                      }),
                    }
                  }
                  return org
                }),
              }

              setConfig({
                ...config,
                // @ts-expect-error
                selectedProject: {
                  ...config.selectedProject,
                  branching: true,
                  branches: [
                    {
                      name: 'main',
                      type: 'prod',
                      key: 'main',
                    },
                  ],
                },
                selectedOrg: {
                  ...selectedOrg,
                  projects: selectedOrg?.projects.map((project) => {
                    if (project.key === selectedProject?.key) {
                      return {
                        ...project,
                        branching: true,
                        branches: [
                          {
                            name: 'main',
                            type: 'prod',
                            key: 'main',
                          },
                        ],
                      }
                    }
                    return project
                  }),
                },
                selectedEnv: {
                  name: 'main',
                  type: 'prod',
                  key: 'main',
                },
                db: { ...updatedDbValues },
              })
            }}
          >
            Enable Branching
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
