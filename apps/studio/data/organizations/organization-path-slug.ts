import { useParams } from 'next/navigation'

export function useOrganizationSlug(): string | undefined {
  const params = useParams() as { slug?: string };
  return params?.slug ? params.slug : undefined;
}