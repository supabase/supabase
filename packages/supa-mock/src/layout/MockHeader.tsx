import { Plug } from 'lucide-react'
import { Button, cn } from 'ui'

import { useMockProject } from '../providers/MockProjectContext'
import { BranchDropdown, OrgDropdown, ProjectDropdown } from './MockHeaderDropdowns'

const LayoutHeaderDivider = ({ className }: { className?: string }) => (
  <span className={cn('text-border-stronger pr-2', className)}>
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M16 3.549L7.12 20.600" />
    </svg>
  </span>
)

export function MockHeader() {
  const { project, organizations } = useMockProject()

  return (
    <header className="flex h-12 items-center flex-shrink-0 border-b">
      <div className="flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4">
        <div className="flex items-center text-sm">
          {/* Supabase Logo */}
          <div className="items-center justify-center flex-shrink-0 flex">
            <svg
              width="18"
              height="18"
              viewBox="0 0 109 113"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                fill="url(#paint0_linear)"
              />
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                fill="url(#paint1_linear)"
                fillOpacity="0.2"
              />
              <path
                d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                fill="#3ECF8E"
              />
              <defs>
                <linearGradient
                  id="paint0_linear"
                  x1="53.9738"
                  y1="54.974"
                  x2="94.1635"
                  y2="71.8295"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#249361" />
                  <stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear"
                  x1="36.1558"
                  y1="30.578"
                  x2="54.4844"
                  y2="65.0806"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center pl-2">
            <LayoutHeaderDivider />
            <OrgDropdown project={project} organizations={organizations} />

            <LayoutHeaderDivider />
            <ProjectDropdown project={project} />

            <LayoutHeaderDivider />
            <BranchDropdown project={project} />

            {/* Connect button */}
            <div className="ml-3 flex items-center">
              <Button type="default" className="rounded-full" icon={<Plug className="rotate-90" />}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
