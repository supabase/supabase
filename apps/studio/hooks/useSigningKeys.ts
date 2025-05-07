import { useSigningKeysQuery } from 'data/signing-keys/signing-keys-query'
import { useSigningKeyCreateMutation } from 'data/signing-keys/signing-keys-create-mutation'

export const useSigningKeys = (projectRef: string) => {
  const { data: signingKeys, isLoading: isSigningKeysLoading } = useSigningKeysQuery({
    projectRef,
  })
  const createSigningKeyMutation = useSigningKeyCreateMutation()

  return {
    signingKeys,
    isSigningKeysLoading,
    createSigningKey: createSigningKeyMutation.mutate,
  }
}
