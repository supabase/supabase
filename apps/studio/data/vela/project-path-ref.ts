
export function getProjectRef(): string | undefined {
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.substring(1).split('/');
    if (pathSegments.length >= 4 && pathSegments[0] === 'org' && pathSegments[2] === 'project') {
      return pathSegments[3];
    }
  }
  return undefined;
}