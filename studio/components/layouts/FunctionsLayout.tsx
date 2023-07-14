import Link from 'next/link'
import { FC, ReactNode, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconExternalLink, IconCode, Modal, IconTerminal } from 'ui'

import ProjectLayout from './'
import { useCheckPermissions, withAuth } from 'hooks'
import { useParams } from 'common/hooks'
import FunctionsNav from '../interfaces/Functions/FunctionsNav'
import NoPermission from 'components/ui/NoPermission'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { TerminalInstructions } from 'components/interfaces/Functions'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'

interface Props {
  title?: string
  children?: ReactNode
}

const FunctionsLayout: FC<Props> = ({ title, children }) => {
  const { functionSlug, ref } = useParams()
  const [showTerminalInstructions, setShowTerminalInstructions] = useState(false)
  const { data: functions, isLoading } = useEdgeFunctionsQuery({ projectRef: ref })
  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef: ref, slug: functionSlug })

  const canReadFunctions = useCheckPermissions(PermissionAction.FUNCTIONS_READ, '*')
  if (!canReadFunctions) {
    return (
      <ProjectLayout title={title || 'Edge Functions'} product="Edge Functions">
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's edge functions" />
        </main>
      </ProjectLayout>
    )
  }

  const name = selectedFunction?.name || ''
  const hasFunctions = (functions ?? []).length > 0
  const centered = !hasFunctions

  return (
    <ProjectLayout isLoading={isLoading} title={title || 'Edge Functions'} product="Edge Functions">
      {centered ? (
        <>
          <div className="mx-auto max-w-5xl py-24 px-5">
            <div
              className="item-center
            flex
            flex-col
            justify-between
            gap-y-4
            xl:flex-row"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'h-6 w-6 rounded border border-brand-600 bg-brand-300',
                    'flex items-center justify-center text-brand-900',
                  ].join(' ')}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.31216 16.101C6.41582 16.6754 7.67021 17 9.00043 17C13.419 17 17.0009 13.4183 17.0009 9C17.0009 7.66622 16.6744 6.40868 16.0971 5.30289M12.7352 1.92336C11.6203 1.33382 10.3494 1 9.00043 1C4.58192 1 1 4.58172 1 9C1 10.3615 1.34015 11.6436 1.94012 12.766M1.94012 12.766C1.61762 13.16 1.42413 13.6637 1.42413 14.2126C1.42413 15.475 2.44753 16.4983 3.70997 16.4983C4.9724 16.4983 5.99581 15.475 5.99581 14.2126C5.99581 12.9502 4.9724 11.9269 3.70997 11.9269C2.99646 11.9269 2.35931 12.2538 1.94012 12.766ZM16.6199 3.7793C16.6199 5.04166 15.5965 6.06501 14.3341 6.06501C13.0716 6.06501 12.0482 5.04166 12.0482 3.7793C12.0482 2.51693 13.0716 1.49358 14.3341 1.49358C15.5965 1.49358 16.6199 2.51693 16.6199 3.7793ZM14.1436 9C14.1436 11.8403 11.8409 14.1429 9.00043 14.1429C6.15996 14.1429 3.8573 11.8403 3.8573 9C3.8573 6.15968 6.15996 3.85714 9.00043 3.85714C11.8409 3.85714 14.1436 6.15968 14.1436 9Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl text-scale-1200">Edge Functions</h1>
                </div>
              </div>
            </div>

            {children}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-grow flex-col py-6">
          <div
            className={[
              'mx-auto flex w-full flex-col transition-all',
              '1xl:px-28 gap-4 px-5 lg:px-16 xl:px-24 2xl:px-32',
            ].join(' ')}
          >
            <div className="item-center flex flex-col justify-between gap-y-4 xl:flex-row">
              <div className="flex items-center gap-3 w-full">
                <div
                  className={[
                    'h-6 w-6 rounded border border-brand-600 bg-brand-300',
                    'flex items-center justify-center text-brand-900',
                  ].join(' ')}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.31216 16.101C6.41582 16.6754 7.67021 17 9.00043 17C13.419 17 17.0009 13.4183 17.0009 9C17.0009 7.66622 16.6744 6.40868 16.0971 5.30289M12.7352 1.92336C11.6203 1.33382 10.3494 1 9.00043 1C4.58192 1 1 4.58172 1 9C1 10.3615 1.34015 11.6436 1.94012 12.766M1.94012 12.766C1.61762 13.16 1.42413 13.6637 1.42413 14.2126C1.42413 15.475 2.44753 16.4983 3.70997 16.4983C4.9724 16.4983 5.99581 15.475 5.99581 14.2126C5.99581 12.9502 4.9724 11.9269 3.70997 11.9269C2.99646 11.9269 2.35931 12.2538 1.94012 12.766ZM16.6199 3.7793C16.6199 5.04166 15.5965 6.06501 14.3341 6.06501C13.0716 6.06501 12.0482 5.04166 12.0482 3.7793C12.0482 2.51693 13.0716 1.49358 14.3341 1.49358C15.5965 1.49358 16.6199 2.51693 16.6199 3.7793ZM14.1436 9C14.1436 11.8403 11.8409 14.1429 9.00043 14.1429C6.15996 14.1429 3.8573 11.8403 3.8573 9C3.8573 6.15968 6.15996 3.85714 9.00043 3.85714C11.8409 3.85714 14.1436 6.15968 14.1436 9Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <Link href={`/project/${ref}/functions`}>
                      <h1 className="cursor-pointer text-2xl text-scale-1200 transition-colors hover:text-scale-1100">
                        Edge Functions
                      </h1>
                    </Link>
                    {name && (
                      <div className="mt-1.5 flex items-center space-x-4">
                        <span className="text-scale-1000">
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
                            <path d="M16 3.549L7.12 20.600"></path>
                          </svg>
                        </span>
                        <h5 className="text-lg text-scale-1200">{name}</h5>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="default"
                      icon={<IconTerminal size={14} strokeWidth={1.5} />}
                      onClick={() => setShowTerminalInstructions(true)}
                    >
                      Terminal Instructions
                    </Button>
                    <Link href="https://supabase.com/docs/guides/functions">
                      <a target="_link">
                        <Button
                          type="default"
                          icon={<IconExternalLink size={14} strokeWidth={1.5} />}
                        >
                          Documentation
                        </Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {selectedFunction !== undefined && <FunctionsNav item={selectedFunction} />}
          </div>
          <div
            className={[
              'mx-auto flex h-full w-full flex-grow flex-col transition-all',
              '1xl:px-28 gap-4 px-5 lg:px-16 xl:px-24 2xl:px-32',
            ].join(' ')}
          >
            {children}
          </div>
        </div>
      )}

      <Modal
        size="xlarge"
        visible={showTerminalInstructions}
        onCancel={() => setShowTerminalInstructions(false)}
        header={<h3>Deploying an edge function to your project</h3>}
        customFooter={
          <div className="w-full flex items-center justify-end">
            <Button type="primary" size="tiny" onClick={() => setShowTerminalInstructions(false)}>
              Confirm
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <TerminalInstructions removeBorder />
        </div>
      </Modal>
    </ProjectLayout>
  )
}

export default withAuth(observer(FunctionsLayout))
