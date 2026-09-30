import { QueryClient } from '@tanstack/react-query'
import { act } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useAWSAccountCreateMutation } from './aws-accounts/aws-account-create-mutation'
import { awsAccountKeys } from './aws-accounts/keys'
import { useBannedIPsDeleteMutation } from './banned-ips/banned-ips-delete-mutations'
import { BannedIPKeys } from './banned-ips/keys'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const optimisticContext = { previousValue: 'before mutation' }

describe('mutation callback contracts', () => {
  it.each([false, true])('preserves custom optimistic context (failure: %s)', async (failure) => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const variables = { projectRef: 'default', ips: ['203.0.113.10'] }
    const key = BannedIPKeys.list(variables.projectRef)
    queryClient.setQueryData(key, { banned_ipv4_addresses: variables.ips })
    addAPIMock({
      method: 'delete',
      path: '/v1/projects/:ref/network-bans',
      response: () =>
        failure
          ? HttpResponse.json<APIErrorBody>({ message: 'Mutation failed' }, { status: 500 })
          : HttpResponse.json<null>(null),
    })
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const { result } = customRenderHook(
      () =>
        useBannedIPsDeleteMutation({
          onMutate: () => optimisticContext,
          onSuccess,
          onError,
        }),
      { queryClient }
    )
    try {
      await act(async () => {
        if (failure) {
          await expect(result.current.mutateAsync(variables)).rejects.toThrow('Mutation failed')
        } else {
          const data = await result.current.mutateAsync(variables)
          expect(onSuccess).toHaveBeenCalledWith(data, variables, optimisticContext)
        }
      })
      if (failure) {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Mutation failed' }),
          variables,
          optimisticContext
        )
        expect(onSuccess).not.toHaveBeenCalled()
      } else {
        expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
        expect(onError).not.toHaveBeenCalled()
      }
    } finally {
      queryClient.clear()
    }
  })

  it.each([false, true])('forwards the SDK mutation context (failure: %s)', async (failure) => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const variables = { projectRef: 'default', awsAccountId: 'test-account' }
    const key = awsAccountKeys.list(variables.projectRef)
    queryClient.setQueryData(key, [])
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/privatelink/associations/aws-account',
      response: () =>
        failure
          ? HttpResponse.json<APIErrorBody>({ message: 'Mutation failed' }, { status: 500 })
          : HttpResponse.json<null>(null),
    })
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const { result } = customRenderHook(
      () =>
        useAWSAccountCreateMutation({
          onMutate: () => optimisticContext,
          onSuccess,
          onError,
        }),
      { queryClient }
    )
    try {
      await act(async () => {
        if (failure) {
          await expect(result.current.mutateAsync(variables)).rejects.toThrow('Mutation failed')
        } else {
          const data = await result.current.mutateAsync(variables)
          expect(onSuccess).toHaveBeenCalledWith(
            data,
            variables,
            optimisticContext,
            expect.objectContaining({ client: queryClient })
          )
        }
      })
      if (failure) {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Mutation failed' }),
          variables,
          optimisticContext,
          expect.objectContaining({ client: queryClient })
        )
        expect(onSuccess).not.toHaveBeenCalled()
      } else {
        expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
        expect(onError).not.toHaveBeenCalled()
      }
    } finally {
      queryClient.clear()
    }
  })
})
