const smartRegionToExactRegionMap = new Map([
  ['Americas', 'East US (North Virginia)'],
  ['Europe', 'Central EU (Frankfurt)'],
  ['APAC', 'Southeast Asia (Singapore)'],
])

export function smartRegionToExactRegion(smartOrExactRegion: string) {
  return smartRegionToExactRegionMap.get(smartOrExactRegion) ?? smartOrExactRegion
}
