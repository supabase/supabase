import { useParams } from 'next/navigation'

export function useOrganizationSlug(): string | undefined {
  const params = useParams() as { slug?: string };
  if (params?.slug) return params.slug;
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.substring(1).split('/');
    if (pathSegments.length > 2 && pathSegments[0] === 'org') {
      return pathSegments[1];
    }
  }
  return undefined;
}