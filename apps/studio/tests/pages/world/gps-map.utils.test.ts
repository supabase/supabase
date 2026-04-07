import { describe, test, expect } from 'vitest'
import {
  latLngToSvgCoords,
  calculateDistance,
  searchCities,
  calculateCityDotSize,
  type City,
} from 'pages/world/gps-map.utils'

// ─── TEST DATA ────────────────────────────────────────────
const MONTREAL: City = { name: 'Montreal', lat: 45.5, lng: -73.57, country: 'CA', province: 'Quebec', population: 1780000 }
const TORONTO: City = { name: 'Toronto', lat: 43.65, lng: -79.38, country: 'CA', province: 'Ontario', population: 2930000 }
const VANCOUVER: City = { name: 'Vancouver', lat: 49.28, lng: -123.12, country: 'CA', province: 'British Columbia', population: 675000 }
const NEW_YORK: City = { name: 'New York', lat: 40.71, lng: -74.01, country: 'US', state: 'New York', population: 8340000 }
const LOS_ANGELES: City = { name: 'Los Angeles', lat: 34.05, lng: -118.24, country: 'US', state: 'California', population: 3970000 }

const TEST_CITIES: City[] = [MONTREAL, TORONTO, VANCOUVER, NEW_YORK, LOS_ANGELES]

// ─── latLngToSvgCoords ───────────────────────────────────
describe('latLngToSvgCoords', () => {
  test('returns x and y as numbers', () => {
    const result = latLngToSvgCoords(45.5, -73.57)
    expect(typeof result.x).toBe('number')
    expect(typeof result.y).toBe('number')
  })

  test('Montreal coords produce valid SVG coordinates', () => {
    const result = latLngToSvgCoords(45.5, -73.57)
    expect(result.x).toBeGreaterThan(0)
    expect(result.x).toBeLessThan(900)
    expect(result.y).toBeGreaterThan(0)
    expect(result.y).toBeLessThan(600)
  })

  test('more western cities have smaller x values', () => {
    const montreal = latLngToSvgCoords(MONTREAL.lat, MONTREAL.lng)
    const vancouver = latLngToSvgCoords(VANCOUVER.lat, VANCOUVER.lng)
    expect(vancouver.x).toBeLessThan(montreal.x)
  })

  test('more northern cities have smaller y values', () => {
    const montreal = latLngToSvgCoords(MONTREAL.lat, MONTREAL.lng)
    const newYork = latLngToSvgCoords(NEW_YORK.lat, NEW_YORK.lng)
    expect(montreal.y).toBeLessThan(newYork.y)
  })

  test('equator and prime meridian produce expected values', () => {
    const result = latLngToSvgCoords(0, 0)
    expect(result.x).toBeCloseTo((170 / 130) * 900, 0)
    expect(result.y).toBeCloseTo((75 / 55) * 600, 0)
  })
})

// ─── calculateDistance ────────────────────────────────────
describe('calculateDistance', () => {
  test('distance from city to itself is 0', () => {
    expect(calculateDistance(MONTREAL, MONTREAL)).toBe(0)
  })

  test('Montreal to Toronto is approximately 504 km', () => {
    const dist = calculateDistance(MONTREAL, TORONTO)
    expect(dist).toBeGreaterThan(480)
    expect(dist).toBeLessThan(530)
  })

  test('distance is symmetric (A→B === B→A)', () => {
    const ab = calculateDistance(MONTREAL, NEW_YORK)
    const ba = calculateDistance(NEW_YORK, MONTREAL)
    expect(ab).toBe(ba)
  })

  test('cross-country distance is large', () => {
    const dist = calculateDistance(MONTREAL, LOS_ANGELES)
    expect(dist).toBeGreaterThan(3500)
  })

  test('returns a rounded integer', () => {
    const dist = calculateDistance(MONTREAL, TORONTO)
    expect(Number.isInteger(dist)).toBe(true)
  })
})

// ─── searchCities ─────────────────────────────────────────
describe('searchCities', () => {
  test('returns empty array for query shorter than 2 chars', () => {
    expect(searchCities('M', TEST_CITIES)).toEqual([])
    expect(searchCities('', TEST_CITIES)).toEqual([])
  })

  test('finds city by name', () => {
    const results = searchCities('montreal', TEST_CITIES)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Montreal')
  })

  test('search is case-insensitive', () => {
    const results = searchCities('TORONTO', TEST_CITIES)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Toronto')
  })

  test('finds city by province', () => {
    const results = searchCities('Quebec', TEST_CITIES)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Montreal')
  })

  test('finds city by state', () => {
    const results = searchCities('California', TEST_CITIES)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Los Angeles')
  })

  test('finds partial matches', () => {
    const results = searchCities('New', TEST_CITIES)
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  test('returns empty array for no matches', () => {
    expect(searchCities('Wakanda', TEST_CITIES)).toEqual([])
  })

  test('respects maxResults limit', () => {
    const results = searchCities('an', TEST_CITIES, 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  test('returns empty for empty cities array', () => {
    expect(searchCities('Montreal', [])).toEqual([])
  })
})

// ─── calculateCityDotSize ─────────────────────────────────
describe('calculateCityDotSize', () => {
  test('minimum size is 2 for very small population', () => {
    expect(calculateCityDotSize(0)).toBe(2)
    expect(calculateCityDotSize(100000)).toBe(2)
  })

  test('maximum size is 6 for very large population', () => {
    expect(calculateCityDotSize(8000000)).toBe(6)
    expect(calculateCityDotSize(50000000)).toBe(6)
  })

  test('population of 500000 gives dot size of 2', () => {
    // 500000 / 500000 = 1, but min is 2
    expect(calculateCityDotSize(500000)).toBe(2)
  })

  test('population of 2500000 gives dot size of 5', () => {
    expect(calculateCityDotSize(2500000)).toBe(5)
  })

  test('scales linearly between min and max', () => {
    const small = calculateCityDotSize(1000000)
    const large = calculateCityDotSize(2000000)
    expect(large).toBeGreaterThan(small)
  })
})
