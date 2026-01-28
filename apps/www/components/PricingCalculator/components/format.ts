'use client'

export function formatUsd(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  }).format(rounded)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
