// ─── GPS MAP UTILITIES ────────────────────────────────────
// Pure functions extracted from gps-map.tsx for testability

export interface City {
  name: string
  lat: number
  lng: number
  country: 'CA' | 'US'
  province?: string
  state?: string
  population: number
}

/**
 * Convert lat/lng to SVG coordinates using simplified projection
 * SVG viewBox is 900x600
 */
export function latLngToSvgCoords(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng + 170) / 130) * 900,
    y: ((75 - lat) / 55) * 600,
  }
}

/**
 * Calculate distance between two cities using the Haversine formula
 * Returns distance in kilometers (rounded)
 */
export function calculateDistance(a: City, b: City): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
}

/**
 * Search cities by name, province, or state
 * Returns up to maxResults matches (default 8)
 */
export function searchCities(query: string, cities: City[], maxResults = 8): City[] {
  if (query.length < 2) return []
  const q = query.toLowerCase()
  return cities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.province?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q)
    )
    .slice(0, maxResults)
}

/**
 * Calculate the dot size for a city on the map based on population
 * Returns a value between 2 and 6
 */
export function calculateCityDotSize(population: number): number {
  return Math.max(2, Math.min(6, population / 500000))
}
