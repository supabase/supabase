import { ChevronDown, PlusIcon, RefreshCw } from 'lucide-react'
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import {
  Button,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  FormControl,
  FormField,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useGitHubAuthorizationQuery } from '@/data/integrations/github-authorization-query'
import { useGitHubRepositoriesQuery } from '@/data/integrations/github-repositories-query'
import { openInstallGitHubIntegrationWindow } from '@/lib/github'
import { EMPTY_ARR } from '@/lib/void'

export type GitHubRepository = {
  id: string
  name: string
  installation_id: number
  default_branch: string
}

export const GITHUB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className="w-5 shrink-0">
    <title>GitHub icon</title>
    <path
      fill="#ffffff"
      fillRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      clipRule="evenodd"
    />
  </svg>
)

export const useGitHubRepositoryOptions = () => {
  const {
    data: gitHubAuthorization,
    isPending: isLoadingGitHubAuthorization,
    refetch: refetchGitHubAuthorization,
  } = useGitHubAuthorizationQuery()

  const {
    data: githubReposData,
    isPending: isLoadingGitHubRepos,
    refetch: refetchGitHubRepositories,
  } = useGitHubRepositoriesQuery({
    enabled: Boolean(gitHubAuthorization),
  })

  const githubRepos = useMemo<GitHubRepository[]>(
    () =>
      githubReposData?.repositories?.map((repo) => ({
        id: repo.id.toString(),
        name: repo.name,
        installation_id: repo.installation_id,
        default_branch: repo.default_branch || 'main',
      })) ?? EMPTY_ARR,
    [githubReposData]
  )

  const refetchGitHubAuthorizationAndRepositories = () => {
    setTimeout(() => {
      refetchGitHubAuthorization()
      refetchGitHubRepositories()
    }, 2000)
  }

  return {
    gitHubAuthorization,
    githubRepos,
    hasPartialResponseDueToSSO: githubReposData?.partial_response_due_to_sso ?? false,
    isLoading: isLoadingGitHubAuthorization || isLoadingGitHubRepos,
    refetch: refetchGitHubAuthorizationAndRepositories,
  }
}

interface GitHubRepositoryFieldProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>
  name: Path<TFormValues>
  label: string
  description?: ReactNode
  layout?: ComponentProps<typeof FormItemLayout>['layout']
  disabled?: boolean
  selectedRepositoryName?: string
  installationIdField?: Path<TFormValues>
  repositoryNameField?: Path<TFormValues>
  repositories: GitHubRepository[]
  gitHubAuthorization: unknown | null
  hasPartialResponseDueToSSO?: boolean
  isLoading?: boolean
  placeholder?: string
  refetch: () => void
  onConnectClick?: () => void
  onRepositorySelect?: (repo: GitHubRepository) => void
}

export const GitHubRepositoryField = <TFormValues extends FieldValues>({
  form,
  name,
  label,
  description,
  layout = 'horizontal',
  disabled = false,
  selectedRepositoryName,
  installationIdField,
  repositoryNameField,
  repositories,
  gitHubAuthorization,
  hasPartialResponseDueToSSO = false,
  isLoading = false,
  placeholder = 'Choose GitHub repository',
  refetch,
  onConnectClick,
  onRepositorySelect,
}: GitHubRepositoryFieldProps<TFormValues>) => {
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false)

  const currentRepositoryId = form.watch(name) as string | undefined
  const selectedRepository = repositories.find((repo) => repo.id === currentRepositoryId)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItemLayout label={label} layout={layout} description={description}>
          {gitHubAuthorization === null ? (
            <FormControl>
              <Button
                type="default"
                size="small"
                htmlType="button"
                disabled={disabled}
                onClick={() => {
                  onConnectClick?.()
                  openInstallGitHubIntegrationWindow('authorize', refetch)
                }}
                icon={GITHUB_ICON}
              >
                Connect GitHub
              </Button>
            </FormControl>
          ) : (
            <Popover_Shadcn_ open={isRepoSelectorOpen} onOpenChange={setIsRepoSelectorOpen}>
              <PopoverTrigger_Shadcn_ asChild>
                <FormControl>
                  <Button
                    type="default"
                    htmlType="button"
                    className="justify-start h-[34px] w-full"
                    disabled={disabled || isLoading}
                    loading={isLoading}
                    icon={GITHUB_ICON}
                    iconRight={
                      <span className="grow flex justify-end">
                        <ChevronDown />
                      </span>
                    }
                  >
                    {selectedRepository?.name ||
                      selectedRepositoryName ||
                      (isLoading ? 'Loading GitHub repositories...' : placeholder)}
                  </Button>
                </FormControl>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                className="p-0"
                side="bottom"
                align="start"
                sameWidthAsTrigger
              >
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Search repositories..." />
                  <CommandList_Shadcn_ className="!max-h-[220px]">
                    <CommandEmpty_Shadcn_>No repositories found.</CommandEmpty_Shadcn_>
                    {repositories.length > 0 ? (
                      <CommandGroup_Shadcn_>
                        {repositories.map((repo) => (
                          <CommandItem_Shadcn_
                            key={repo.id}
                            value={`${repo.name.replaceAll('"', '')}-${repo.id}`}
                            className="flex gap-2 items-center"
                            onSelect={() => {
                              field.onChange(repo.id)

                              if (installationIdField !== undefined) {
                                form.setValue(installationIdField, repo.installation_id as never, {
                                  shouldDirty: true,
                                })
                              }

                              if (repositoryNameField !== undefined) {
                                form.setValue(repositoryNameField, repo.name as never, {
                                  shouldDirty: true,
                                })
                              }

                              onRepositorySelect?.(repo)
                              setIsRepoSelectorOpen(false)
                            }}
                          >
                            {GITHUB_ICON}
                            <span className="truncate" title={repo.name}>
                              {repo.name}
                            </span>
                          </CommandItem_Shadcn_>
                        ))}
                      </CommandGroup_Shadcn_>
                    ) : null}
                    <CommandGroup_Shadcn_>
                      <CommandItem_Shadcn_
                        className="flex gap-2 items-center cursor-pointer"
                        onSelect={() => {
                          setIsRepoSelectorOpen(false)
                          openInstallGitHubIntegrationWindow('install', refetch)
                        }}
                      >
                        <PlusIcon size={16} />
                        Add GitHub Repositories
                      </CommandItem_Shadcn_>
                    </CommandGroup_Shadcn_>
                    {hasPartialResponseDueToSSO && (
                      <>
                        <CommandSeparator_Shadcn_ />
                        <CommandGroup_Shadcn_>
                          <CommandItem_Shadcn_
                            className="flex gap-2 items-start cursor-pointer"
                            onSelect={() => {
                              setIsRepoSelectorOpen(false)
                              openInstallGitHubIntegrationWindow('authorize', refetch)
                            }}
                          >
                            <RefreshCw size={16} className="mt-0.5 shrink-0" />
                            <div className="text-xs text-foreground-light">
                              Re-authorize GitHub with SSO to show all repositories
                            </div>
                          </CommandItem_Shadcn_>
                        </CommandGroup_Shadcn_>
                      </>
                    )}
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}
        </FormItemLayout>
      )}
    />
  )
}
