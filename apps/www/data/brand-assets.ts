export interface BrandAsset {
  id: string
  name: string
  canvas: 'light' | 'dark' | 'any'
  svg: string
  png: string
  pngWidth: number
  pngHeight: number
  group: 'icon' | 'logo' | 'one-color'
}

export const BRAND_ASSETS: BrandAsset[] = [
  {
    id: 'icon-green-transparent',
    group: 'icon',
    name: 'Icon',
    canvas: 'any',
    svg: '/brand-assets/supabase-icon-green-transparent.svg',
    png: '/brand-assets/supabase-icon-green-transparent.png',
    pngWidth: 436,
    pngHeight: 449,
  },
  {
    id: 'logo-green-black-transparent',
    group: 'logo',
    name: 'Wordmark for light backgrounds',
    canvas: 'light',
    svg: '/brand-assets/supabase-logo-green-black-transparent.svg',
    png: '/brand-assets/supabase-logo-green-black-transparent.png',
    pngWidth: 2322,
    pngHeight: 449,
  },
  {
    id: 'logo-green-white-transparent',
    group: 'logo',
    name: 'Wordmark for dark backgrounds',
    canvas: 'dark',
    svg: '/brand-assets/supabase-logo-green-white-transparent.svg',
    png: '/brand-assets/supabase-logo-green-white-transparent.png',
    pngWidth: 2322,
    pngHeight: 449,
  },
  {
    id: 'logo-black-transparent',
    group: 'one-color',
    name: 'One-color wordmark, black',
    canvas: 'light',
    svg: '/brand-assets/supabase-logo-black-transparent.svg',
    png: '/brand-assets/supabase-logo-black-transparent.png',
    pngWidth: 2000,
    pngHeight: 389,
  },
  {
    id: 'logo-white-transparent',
    group: 'one-color',
    name: 'One-color wordmark, white',
    canvas: 'dark',
    svg: '/brand-assets/supabase-logo-white-transparent.svg',
    png: '/brand-assets/supabase-logo-white-transparent.png',
    pngWidth: 2000,
    pngHeight: 389,
  },
]
