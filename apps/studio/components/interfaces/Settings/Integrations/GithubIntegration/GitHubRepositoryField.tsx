import { ChevronDown, PlusIcon, RefreshCw } from 'lucide-react'
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { useWatch, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  FormControl,
  FormField,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ConnectGitHubButton } from './ConnectGitHubButton'
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

  const currentRepositoryId = useWatch({ control: form.control, name }) as string | undefined
  const selectedRepository = repositories.find((repo) => repo.id === currentRepositoryId)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItemLayout id={name} label={label} layout={layout} description={description}>
          {gitHubAuthorization === null && !currentRepositoryId ? (
            <FormControl>
              <ConnectGitHubButton id={name} onConnectClick={onConnectClick} refetch={refetch} />
            </FormControl>
          ) : (
            <Popover open={isRepoSelectorOpen} onOpenChange={setIsRepoSelectorOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    id={name}
                    type="button"
                    className="justify-start h-[34px] w-full [&>div:last-child]:ml-auto"
                    disabled={disabled || isLoading}
                    loading={!!gitHubAuthorization && isLoading}
                    iconRight={<ChevronDown />}
                  >
                    {selectedRepository?.name ||
                      selectedRepositoryName ||
                      (isLoading ? 'Loading GitHub repositories...' : placeholder)}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom" align="start" sameWidthAsTrigger>
                <Command>
                  <CommandInput placeholder="Search repositories..." />
                  <CommandList className="!max-h-[220px]">
                    <CommandEmpty>No repositories found.</CommandEmpty>
                    {repositories.length > 0 ? (
                      <CommandGroup>
                        {repositories.map((repo) => (
                          <CommandItem
                            key={repo.id}
                            value={`${repo.name.replaceAll('"', '')}-${repo.id}`}
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
                            <span className="truncate" title={repo.name}>
                              {repo.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : null}
                    <CommandGroup>
                      <CommandItem
                        className="flex gap-2 items-center cursor-pointer"
                        onSelect={() => {
                          setIsRepoSelectorOpen(false)
                          openInstallGitHubIntegrationWindow('install', refetch)
                        }}
                      >
                        <PlusIcon size={16} />
                        Add GitHub Repositories
                      </CommandItem>
                    </CommandGroup>
                    {hasPartialResponseDueToSSO && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
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
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </FormItemLayout>
      )}
    />
  )
}
