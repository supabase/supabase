import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

// ROAD TYPES: gravel=orange, small=red, paved=black/grey
// Continent outlines + roads for the entire world - 100% GRATUIT / FREE

interface Road {
  path: string
  type: 'highway' | 'paved' | 'small' | 'gravel'
}

interface Region {
  name: string
  outline: string
  center: { x: number; y: number }
  roads: Road[]
}

const ROAD_COLORS = {
  highway: { stroke: '#444444', width: 2.5, label: 'Autoroute / Highway' },
  paved: { stroke: '#333333', width: 1.8, label: 'Asphalte / Paved' },
  small: { stroke: '#cc2200', width: 1.2, label: 'Petit chemin / Small road' },
  gravel: { stroke: '#ff8c00', width: 1, label: 'Gravelle / Gravel' },
}

// Simplified world regions with roads
const REGIONS: Region[] = [
  {
    name: 'North America',
    outline: 'M80,80 L120,60 L180,55 L220,60 L250,75 L260,95 L255,120 L240,140 L230,160 L220,175 L200,180 L180,175 L160,165 L140,160 L120,155 L100,150 L85,135 L75,110 Z',
    center: { x: 170, y: 120 },
    roads: [
      // Trans-Canada Highway
      { path: 'M95,90 L120,85 L150,82 L180,80 L210,83 L235,90', type: 'highway' },
      // US Interstate system
      { path: 'M130,110 L160,108 L190,110 L220,115', type: 'highway' },
      { path: 'M140,105 L140,130 L150,150', type: 'highway' },
      { path: 'M190,105 L195,125 L200,145', type: 'highway' },
      // Paved roads
      { path: 'M100,95 L115,100 L130,98', type: 'paved' },
      { path: 'M150,95 L165,100 L180,95', type: 'paved' },
      { path: 'M200,100 L215,105 L225,100', type: 'paved' },
      { path: 'M120,120 L135,125 L150,120', type: 'paved' },
      { path: 'M160,130 L175,135 L190,130', type: 'paved' },
      // Small roads - Quebec/Ontario
      { path: 'M140,90 L145,95 L142,100', type: 'small' },
      { path: 'M155,88 L160,92 L158,97', type: 'small' },
      { path: 'M170,90 L175,95 L172,100', type: 'small' },
      // Gravel roads - Northern Canada
      { path: 'M130,75 L135,70 L140,72', type: 'gravel' },
      { path: 'M160,70 L165,65 L170,68', type: 'gravel' },
      { path: 'M190,72 L195,68 L200,70', type: 'gravel' },
      { path: 'M110,80 L115,75 L120,78', type: 'gravel' },
      // Gravel roads - Rural USA
      { path: 'M145,130 L150,135 L148,140', type: 'gravel' },
      { path: 'M175,140 L180,145 L178,150', type: 'gravel' },
    ],
  },
  {
    name: 'South America',
    outline: 'M170,185 L185,180 L200,185 L210,200 L215,220 L210,240 L200,260 L190,275 L180,280 L170,275 L165,260 L160,240 L155,220 L160,200 Z',
    center: { x: 185, y: 230 },
    roads: [
      { path: 'M175,190 L185,200 L190,215 L192,235 L188,255', type: 'highway' },
      { path: 'M180,195 L195,200 L205,210', type: 'paved' },
      { path: 'M170,210 L180,215 L190,210', type: 'paved' },
      { path: 'M178,225 L185,230 L180,240', type: 'small' },
      { path: 'M165,215 L170,220 L168,225', type: 'small' },
      { path: 'M195,230 L200,235 L198,240', type: 'gravel' },
      { path: 'M175,250 L180,255 L178,260', type: 'gravel' },
      { path: 'M185,245 L190,250 L188,255', type: 'gravel' },
    ],
  },
  {
    name: 'Europe',
    outline: 'M310,60 L340,55 L370,58 L390,65 L395,80 L390,95 L380,105 L360,110 L340,108 L320,105 L305,95 L300,80 Z',
    center: { x: 350, y: 82 },
    roads: [
      { path: 'M315,75 L335,72 L355,70 L375,73 L390,78', type: 'highway' },
      { path: 'M330,80 L350,78 L370,80', type: 'highway' },
      { path: 'M340,68 L345,80 L348,92', type: 'highway' },
      { path: 'M320,82 L330,85 L340,83', type: 'paved' },
      { path: 'M355,75 L365,78 L375,76', type: 'paved' },
      { path: 'M345,90 L355,93 L365,91', type: 'paved' },
      { path: 'M325,70 L330,73 L328,76', type: 'small' },
      { path: 'M360,85 L365,88 L363,91', type: 'small' },
      { path: 'M310,85 L315,88 L313,91', type: 'gravel' },
      { path: 'M380,90 L385,93 L383,96', type: 'gravel' },
    ],
  },
  {
    name: 'Africa',
    outline: 'M320,115 L350,110 L380,115 L395,130 L400,155 L395,180 L385,200 L370,210 L350,215 L335,210 L325,200 L315,180 L310,155 L315,130 Z',
    center: { x: 355, y: 165 },
    roads: [
      { path: 'M340,120 L355,130 L360,150 L358,175 L355,195', type: 'highway' },
      { path: 'M330,135 L345,140 L360,138', type: 'paved' },
      { path: 'M345,160 L360,165 L375,162', type: 'paved' },
      { path: 'M335,150 L340,155 L338,160', type: 'small' },
      { path: 'M365,170 L370,175 L368,180', type: 'small' },
      { path: 'M325,140 L330,145 L328,150', type: 'gravel' },
      { path: 'M370,145 L375,150 L373,155', type: 'gravel' },
      { path: 'M340,180 L345,185 L343,190', type: 'gravel' },
      { path: 'M360,185 L365,190 L363,195', type: 'gravel' },
      { path: 'M350,200 L355,205 L353,210', type: 'gravel' },
    ],
  },
  {
    name: 'Asia',
    outline: 'M400,50 L440,45 L490,48 L540,55 L570,65 L580,85 L575,110 L560,130 L540,140 L510,145 L480,140 L450,135 L420,125 L400,110 L395,90 L398,70 Z',
    center: { x: 490, y: 95 },
    roads: [
      { path: 'M410,80 L440,75 L480,72 L520,75 L555,80', type: 'highway' },
      { path: 'M450,85 L480,82 L510,85', type: 'highway' },
      { path: 'M480,70 L485,85 L490,100 L495,120', type: 'highway' },
      { path: 'M420,90 L435,93 L450,91', type: 'paved' },
      { path: 'M510,90 L525,93 L540,91', type: 'paved' },
      { path: 'M460,100 L475,103 L490,101', type: 'paved' },
      { path: 'M430,100 L435,105 L433,110', type: 'small' },
      { path: 'M500,105 L505,110 L503,115', type: 'small' },
      { path: 'M545,85 L550,90 L548,95', type: 'small' },
      { path: 'M410,65 L415,70 L413,75', type: 'gravel' },
      { path: 'M520,65 L525,70 L523,75', type: 'gravel' },
      { path: 'M470,110 L475,115 L473,120', type: 'gravel' },
      { path: 'M530,110 L535,115 L533,120', type: 'gravel' },
    ],
  },
  {
    name: 'Oceania',
    outline: 'M520,175 L550,170 L580,172 L595,180 L600,195 L595,210 L580,218 L560,220 L540,218 L525,210 L520,195 Z',
    center: { x: 560, y: 195 },
    roads: [
      { path: 'M535,185 L555,182 L575,185 L590,190', type: 'highway' },
      { path: 'M545,192 L560,190 L575,192', type: 'paved' },
      { path: 'M550,198 L560,200 L570,198', type: 'paved' },
      { path: 'M540,202 L545,207 L543,212', type: 'small' },
      { path: 'M570,200 L575,205 L573,210', type: 'small' },
      { path: 'M530,190 L535,195 L533,200', type: 'gravel' },
      { path: 'M585,195 L590,200 L588,205', type: 'gravel' },
    ],
  },
]

const CITIES_WORLD = [
  { name: 'Montreal', x: 165, y: 92, size: 3 },
  { name: 'Toronto', x: 155, y: 95, size: 3 },
  { name: 'Vancouver', x: 100, y: 88, size: 2 },
  { name: 'New York', x: 175, y: 108, size: 4 },
  { name: 'Los Angeles', x: 115, y: 118, size: 3 },
  { name: 'Mexico City', x: 140, y: 148, size: 3 },
  { name: 'Sao Paulo', x: 195, y: 240, size: 3 },
  { name: 'Buenos Aires', x: 185, y: 265, size: 2 },
  { name: 'London', x: 330, y: 72, size: 3 },
  { name: 'Paris', x: 340, y: 78, size: 3 },
  { name: 'Berlin', x: 355, y: 72, size: 2 },
  { name: 'Rome', x: 352, y: 88, size: 2 },
  { name: 'Moscow', x: 400, y: 68, size: 3 },
  { name: 'Cairo', x: 365, y: 125, size: 2 },
  { name: 'Lagos', x: 340, y: 160, size: 2 },
  { name: 'Nairobi', x: 375, y: 175, size: 2 },
  { name: 'Cape Town', x: 355, y: 210, size: 2 },
  { name: 'Dubai', x: 420, y: 115, size: 2 },
  { name: 'Mumbai', x: 455, y: 120, size: 3 },
  { name: 'Beijing', x: 510, y: 80, size: 3 },
  { name: 'Tokyo', x: 545, y: 88, size: 4 },
  { name: 'Shanghai', x: 515, y: 95, size: 3 },
  { name: 'Seoul', x: 525, y: 85, size: 2 },
  { name: 'Bangkok', x: 490, y: 125, size: 2 },
  { name: 'Singapore', x: 500, y: 145, size: 2 },
  { name: 'Sydney', x: 570, y: 200, size: 3 },
  { name: 'Auckland', x: 595, y: 210, size: 2 },
]

const WorldMapPage: NextPageWithLayout = () => {
  const router = useRouter()
  const lang = (router.query.lang as LangCode) || 'fr'
  const [currentLang, setCurrentLang] = useState<LangCode>(lang)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showRoadTypes, setShowRoadTypes] = useState({ highway: true, paved: true, small: true, gravel: true })
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  return (
    <>
      <Head>
        <title>MARCEAU - World Map GRATUIT / FREE</title>
      </Head>

      <div className="fixed inset-0 bg-black flex flex-col" style={{ fontFamily: "'Courier New', monospace" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b z-10" style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.95)' }}>
          <div className="flex items-center gap-4">
            <Link href={'/world?lang=' + currentLang} passHref legacyBehavior>
              <a style={{ color: '#ff8c00' }} className="text-sm">← Dashboard</a>
            </Link>
            <h1 className="text-lg font-bold" style={{ color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}>
              🌍 World Map - 100% GRATUIT / FREE
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#00ff0022', color: '#00ff00', border: '1px solid #00ff0033' }}>
              OPEN SOURCE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Road type toggles */}
            <div className="flex gap-1">
              {(Object.entries(ROAD_COLORS) as [string, any][]).map(([type, config]) => (
                <button
                  key={type}
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: showRoadTypes[type as keyof typeof showRoadTypes] ? config.stroke + '33' : 'transparent',
                    color: showRoadTypes[type as keyof typeof showRoadTypes] ? config.stroke === '#444444' || config.stroke === '#333333' ? '#999' : config.stroke : '#333',
                    border: '1px solid ' + (showRoadTypes[type as keyof typeof showRoadTypes] ? config.stroke : '#333'),
                  }}
                  onClick={() => setShowRoadTypes(prev => ({ ...prev, [type]: !prev[type as keyof typeof prev] }))}
                >
                  {config.label.split(' / ')[currentLang === 'fr' ? 0 : 1] || config.label}
                </button>
              ))}
            </div>

            {/* Language */}
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="text-xs px-2 py-1 border rounded" style={{ borderColor: '#ff6600', color: '#ff8c00' }}>
                🌐 {LANGUAGES[currentLang]}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-1 w-40 rounded border z-50 max-h-60 overflow-y-auto" style={{ borderColor: '#ff6600', background: '#111' }}>
                  {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                    <button key={code} className="block w-full text-left px-3 py-1 text-xs" style={{ color: currentLang === code ? '#ff8c00' : '#666' }} onClick={() => { setCurrentLang(code); setShowLangMenu(false) }}>
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            viewBox="0 0 650 320"
            className="w-full h-full"
            style={{ transform: 'scale(' + zoom + ') translate(' + pan.x + 'px, ' + pan.y + 'px)' }}
          >
            {/* Ocean */}
            <rect width="650" height="320" fill="#050a14" />

            {/* Grid */}
            {Array.from({ length: 33 }, (_, i) => (
              <line key={'h' + i} x1="0" y1={i * 10} x2="650" y2={i * 10} stroke="#0a1520" strokeWidth="0.3" />
            ))}
            {Array.from({ length: 66 }, (_, i) => (
              <line key={'v' + i} x1={i * 10} y1="0" x2={i * 10} y2="320" stroke="#0a1520" strokeWidth="0.3" />
            ))}

            {/* Equator */}
            <line x1="0" y1="160" x2="650" y2="160" stroke="#ff660011" strokeWidth="0.5" strokeDasharray="5,5" />

            {/* Regions */}
            {REGIONS.map((region) => (
              <g key={region.name}>
                {/* Land mass */}
                <path
                  d={region.outline}
                  fill={hoveredRegion === region.name ? '#1a1a0a' : '#0d0d05'}
                  stroke="#ff660022"
                  strokeWidth="0.8"
                  onMouseEnter={() => setHoveredRegion(region.name)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  style={{ cursor: 'pointer' }}
                />

                {/* Roads */}
                {region.roads.map((road, i) => (
                  showRoadTypes[road.type] && (
                    <path
                      key={i}
                      d={road.path}
                      fill="none"
                      stroke={ROAD_COLORS[road.type].stroke}
                      strokeWidth={ROAD_COLORS[road.type].width / zoom}
                      strokeLinecap="round"
                      opacity={0.8}
                    />
                  )
                ))}

                {/* Region label */}
                <text
                  x={region.center.x}
                  y={region.center.y}
                  fill="#ff660022"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {region.name}
                </text>
              </g>
            ))}

            {/* Cities */}
            {CITIES_WORLD.map((city) => (
              <g
                key={city.name}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={hoveredCity === city.name ? city.size + 2 : city.size}
                  fill={hoveredCity === city.name ? '#ff8c00' : '#ff660088'}
                />
                {(hoveredCity === city.name || city.size >= 3) && (
                  <text
                    x={city.x + city.size + 3}
                    y={city.y + 3}
                    fill={hoveredCity === city.name ? '#ff8c00' : '#ff660044'}
                    fontSize={hoveredCity === city.name ? '7' : '5'}
                    fontFamily="monospace"
                  >
                    {city.name}
                  </text>
                )}
                {hoveredCity === city.name && (
                  <circle cx={city.x} cy={city.y} r={city.size + 6} fill="none" stroke="#ff8c0044" strokeWidth="0.5">
                    <animate attributeName="r" from={String(city.size + 4)} to={String(city.size + 12)} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            ))}
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
            <button onClick={() => setZoom(z => Math.min(z + 0.3, 4))} className="w-8 h-8 rounded border flex items-center justify-center text-sm" style={{ borderColor: '#ff6600', background: 'rgba(0,0,0,0.9)', color: '#ff8c00' }}>+</button>
            <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.5))} className="w-8 h-8 rounded border flex items-center justify-center text-sm" style={{ borderColor: '#ff6600', background: 'rgba(0,0,0,0.9)', color: '#ff8c00' }}>-</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="w-8 h-8 rounded border flex items-center justify-center text-[10px]" style={{ borderColor: '#ff6600', background: 'rgba(0,0,0,0.9)', color: '#ff8c00' }}>⟲</button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 p-3 rounded-lg z-10" style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #ff660033' }}>
            <p className="text-[10px] font-bold mb-2" style={{ color: '#ff8c00' }}>LEGENDE / LEGEND</p>
            {(Object.entries(ROAD_COLORS) as [string, any][]).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <div className="w-6 h-0 border-t-2" style={{ borderColor: config.stroke }} />
                <span className="text-[9px]" style={{ color: config.stroke === '#444444' || config.stroke === '#333333' ? '#999' : config.stroke }}>
                  {config.label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#ff660088' }} />
              <span className="text-[9px]" style={{ color: '#ff660088' }}>Ville / City</span>
            </div>
          </div>

          {/* Free badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full z-10" style={{ background: 'rgba(0,255,0,0.1)', border: '1px solid #00ff0033' }}>
            <span className="text-xs font-bold" style={{ color: '#00ff00' }}>
              🆓 100% GRATUIT - Maps libres pour tous / Free maps for everyone
            </span>
          </div>

          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)' }} />
        </div>
      </div>
    </>
  )
}

WorldMapPage.getLayout = (page: any) => page

export default WorldMapPage
