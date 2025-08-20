
export function getOrganizationSlug(): string | undefined {
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.substring(1).split('/');
    if (pathSegments.length >= 2 && pathSegments[0] === 'org') {
      return pathSegments[1];
    }
  }
  return undefined;
}