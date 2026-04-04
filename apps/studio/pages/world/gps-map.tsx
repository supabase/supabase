import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

// ─── MUSIC PLAYLIST ───────────────────────────────────────
interface Track {
  title: string
  artist: string
  duration: string
  genre: string
}

const PLAYLIST: Track[] = [
  { title: 'Night Drive', artist: 'MARCEAU Beats', duration: '3:42', genre: 'Synthwave' },
  { title: 'Highway Phantom', artist: 'Agent Alex', duration: '4:15', genre: 'Dark Electro' },
  { title: 'Neon City Lights', artist: 'Ti-Lex-Al', duration: '3:58', genre: 'Cyberpunk' },
  { title: 'Code Runner', artist: 'MARCEAU Beats', duration: '5:01', genre: 'Drum & Bass' },
  { title: 'Midnight Protocol', artist: 'Agent Alex', duration: '4:33', genre: 'Dark Ambient' },
  { title: 'Digital Horizon', artist: 'MARCEAU Beats', duration: '3:27', genre: 'Synthwave' },
  { title: 'Route 666', artist: 'Ti-Lex-Al', duration: '4:45', genre: 'Industrial' },
  { title: 'Firewall Breaker', artist: 'Agent Alex', duration: '3:12', genre: 'Techno' },
  { title: 'Northern Lights', artist: 'MARCEAU Beats', duration: '6:10', genre: 'Ambient' },
  { title: 'Turbo Boost', artist: 'Ti-Lex-Al', duration: '2:58', genre: 'EDM' },
]

// ─── MINI MUSIC PLAYER ───────────────────────────────────
function MiniMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [progress, setProgress] = useState(0)
  const [shuffle, setShuffle] = useState(false)

  const track = PLAYLIST[currentTrack]

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          // Auto next track
          setCurrentTrack((c) => (c + 1) % PLAYLIST.length)
          return 0
        }
        return p + 0.5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying])

  const nextTrack = useCallback(() => {
    if (shuffle) {
      setCurrentTrack(Math.floor(Math.random() * PLAYLIST.length))
    } else {
      setCurrentTrack((c) => (c + 1) % PLAYLIST.length)
    }
    setProgress(0)
  }, [shuffle])

  const prevTrack = useCallback(() => {
    setCurrentTrack((c) => (c - 1 + PLAYLIST.length) % PLAYLIST.length)
    setProgress(0)
  }, [])

  const selectTrack = useCallback((index: number) => {
    setCurrentTrack(index)
    setProgress(0)
    setIsPlaying(true)
    setShowPlaylist(false)
  }, [])

  // Collapsed: just a small button
  if (!isOpen) {
    return (
      <motion.button
        className="absolute top-4 left-4 w-12 h-12 rounded-full border-2 flex items-center justify-center z-10"
        style={{
          borderColor: '#ff0000',
          background: 'rgba(0,0,0,0.9)',
          boxShadow: '0 0 15px rgba(255,0,0,0.3)',
        }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(255,0,0,0.5)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        title="YouTube Music"
      >
        <span className="text-lg">🎵</span>
      </motion.button>
    )
  }

  return (
    <motion.div
      className="absolute top-4 left-4 z-10 rounded-xl border overflow-hidden"
      style={{
        width: showPlaylist ? 320 : 280,
        borderColor: '#ff660066',
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 30px rgba(255,100,0,0.15)',
      }}
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: '#ff660033', background: 'rgba(255,0,0,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🎵</span>
          <span className="text-xs font-bold" style={{ color: '#ff0000' }}>YouTube Music</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ color: '#ff660088' }}
        >
          ✕
        </button>
      </div>

      {/* Now playing */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Album art placeholder */}
          <motion.div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ff4500, #ff8c00)',
              boxShadow: isPlaying ? '0 0 15px rgba(255,100,0,0.4)' : 'none',
            }}
            animate={isPlaying ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={isPlaying ? { duration: 4, repeat: Infinity, ease: 'linear' } : {}}
          >
            🎶
          </motion.div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-bold truncate"
              style={{ color: '#ff8c00' }}
            >
              {track.title}
            </p>
            <p className="text-[10px] truncate" style={{ color: '#ff660077' }}>
              {track.artist} • {track.genre}
            </p>
          </div>
          <span className="text-[10px] flex-shrink-0" style={{ color: '#ff660044' }}>
            {track.duration}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#ff660022' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #ff4500, #ff8c00)', width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            onClick={() => setShuffle(!shuffle)}
            className="text-xs"
            style={{ color: shuffle ? '#ff8c00' : '#ff660044' }}
            title="Shuffle"
          >
            🔀
          </button>
          <button
            onClick={prevTrack}
            className="text-sm"
            style={{ color: '#ff8c00' }}
          >
            ⏮
          </button>
          <motion.button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, #ff4500, #ff8c00)'
                : 'rgba(255,100,0,0.2)',
              border: '1px solid #ff6600',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <span className="text-sm" style={{ color: isPlaying ? '#000' : '#ff8c00' }}>
              {isPlaying ? '⏸' : '▶'}
            </span>
          </motion.button>
          <button
            onClick={nextTrack}
            className="text-sm"
            style={{ color: '#ff8c00' }}
          >
            ⏭
          </button>
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="text-xs"
            style={{ color: showPlaylist ? '#ff8c00' : '#ff660044' }}
            title="Playlist"
          >
            📋
          </button>
        </div>
      </div>

      {/* Playlist dropdown */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            className="border-t max-h-48 overflow-y-auto"
            style={{ borderColor: '#ff660033' }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {PLAYLIST.map((trk, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left"
                style={{
                  background: i === currentTrack ? 'rgba(255,100,0,0.15)' : 'transparent',
                  borderBottom: '1px solid #ff660011',
                }}
                onClick={() => selectTrack(i)}
              >
                <span className="text-[10px] w-4" style={{ color: i === currentTrack ? '#ff8c00' : '#ff660044' }}>
                  {i === currentTrack && isPlaying ? '▶' : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] truncate"
                    style={{ color: i === currentTrack ? '#ff8c00' : '#ff660088' }}
                  >
                    {trk.title}
                  </p>
                  <p className="text-[9px] truncate" style={{ color: '#ff660044' }}>
                    {trk.artist}
                  </p>
                </div>
                <span className="text-[9px] flex-shrink-0" style={{ color: '#ff660033' }}>
                  {trk.duration}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── CITIES DATABASE (Canada + USA) ───────────────────────
interface City {
  name: string
  lat: number
  lng: number
  country: 'CA' | 'US'
  province?: string
  state?: string
  population: number
}

const CITIES: City[] = [
  // Canada
  { name: 'Montreal', lat: 45.50, lng: -73.57, country: 'CA', province: 'Quebec', population: 1780000 },
  { name: 'Toronto', lat: 43.65, lng: -79.38, country: 'CA', province: 'Ontario', population: 2930000 },
  { name: 'Vancouver', lat: 49.28, lng: -123.12, country: 'CA', province: 'British Columbia', population: 675000 },
  { name: 'Ottawa', lat: 45.42, lng: -75.70, country: 'CA', province: 'Ontario', population: 1017000 },
  { name: 'Calgary', lat: 51.05, lng: -114.07, country: 'CA', province: 'Alberta', population: 1336000 },
  { name: 'Edmonton', lat: 53.55, lng: -113.49, country: 'CA', province: 'Alberta', population: 1010000 },
  { name: 'Quebec City', lat: 46.81, lng: -71.21, country: 'CA', province: 'Quebec', population: 549000 },
  { name: 'Winnipeg', lat: 49.90, lng: -97.14, country: 'CA', province: 'Manitoba', population: 749000 },
  { name: 'Halifax', lat: 44.65, lng: -63.57, country: 'CA', province: 'Nova Scotia', population: 431000 },
  { name: 'Victoria', lat: 48.43, lng: -123.37, country: 'CA', province: 'British Columbia', population: 92000 },
  { name: 'Saskatoon', lat: 52.13, lng: -106.67, country: 'CA', province: 'Saskatchewan', population: 317000 },
  { name: 'Regina', lat: 50.45, lng: -104.62, country: 'CA', province: 'Saskatchewan', population: 228000 },
  { name: 'St. John\'s', lat: 47.56, lng: -52.71, country: 'CA', province: 'Newfoundland', population: 114000 },
  { name: 'Fredericton', lat: 45.96, lng: -66.64, country: 'CA', province: 'New Brunswick', population: 63000 },
  { name: 'Charlottetown', lat: 46.24, lng: -63.13, country: 'CA', province: 'PEI', population: 38000 },
  { name: 'Whitehorse', lat: 60.72, lng: -135.06, country: 'CA', province: 'Yukon', population: 28000 },
  { name: 'Yellowknife', lat: 62.45, lng: -114.37, country: 'CA', province: 'NWT', population: 20000 },
  { name: 'Iqaluit', lat: 63.75, lng: -68.52, country: 'CA', province: 'Nunavut', population: 8000 },
  // USA
  { name: 'New York', lat: 40.71, lng: -74.01, country: 'US', state: 'New York', population: 8340000 },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24, country: 'US', state: 'California', population: 3970000 },
  { name: 'Chicago', lat: 41.88, lng: -87.63, country: 'US', state: 'Illinois', population: 2700000 },
  { name: 'Houston', lat: 29.76, lng: -95.37, country: 'US', state: 'Texas', population: 2300000 },
  { name: 'Phoenix', lat: 33.45, lng: -112.07, country: 'US', state: 'Arizona', population: 1680000 },
  { name: 'Philadelphia', lat: 39.95, lng: -75.17, country: 'US', state: 'Pennsylvania', population: 1580000 },
  { name: 'San Antonio', lat: 29.42, lng: -98.49, country: 'US', state: 'Texas', population: 1530000 },
  { name: 'San Diego', lat: 32.72, lng: -117.16, country: 'US', state: 'California', population: 1420000 },
  { name: 'Dallas', lat: 32.78, lng: -96.80, country: 'US', state: 'Texas', population: 1340000 },
  { name: 'Miami', lat: 25.76, lng: -80.19, country: 'US', state: 'Florida', population: 470000 },
  { name: 'Atlanta', lat: 33.75, lng: -84.39, country: 'US', state: 'Georgia', population: 500000 },
  { name: 'Boston', lat: 42.36, lng: -71.06, country: 'US', state: 'Massachusetts', population: 690000 },
  { name: 'Seattle', lat: 47.61, lng: -122.33, country: 'US', state: 'Washington', population: 740000 },
  { name: 'Denver', lat: 39.74, lng: -104.99, country: 'US', state: 'Colorado', population: 715000 },
  { name: 'Las Vegas', lat: 36.17, lng: -115.14, country: 'US', state: 'Nevada', population: 650000 },
  { name: 'Detroit', lat: 42.33, lng: -83.05, country: 'US', state: 'Michigan', population: 640000 },
  { name: 'Washington DC', lat: 38.91, lng: -77.04, country: 'US', state: 'DC', population: 690000 },
  { name: 'San Francisco', lat: 37.77, lng: -122.42, country: 'US', state: 'California', population: 870000 },
]

// ─── AI SUGGESTIONS ───────────────────────────────────────
const AI_SUGGESTIONS: Record<string, string[]> = {
  fr: [
    'Je te suggere de visiter le Vieux-Montreal, c\'est magnifique!',
    'La route vers Toronto est fluide en ce moment. Bon voyage!',
    'Il y a un excellent restaurant a 5 min de ta position.',
    'Attention, trafic dense sur l\'autoroute 401 pres de Toronto.',
    'Tu devrais essayer la poutine a Quebec City!',
    'Le parc Stanley a Vancouver est superbe en cette saison.',
  ],
  en: [
    'I suggest visiting Old Montreal, it\'s beautiful!',
    'The route to Toronto is clear right now. Safe travels!',
    'There\'s an excellent restaurant 5 min from your position.',
    'Warning: heavy traffic on Highway 401 near Toronto.',
    'You should try the poutine in Quebec City!',
    'Stanley Park in Vancouver is gorgeous this time of year.',
  ],
}

// ─── MAP COMPONENT (SVG) ─────────────────────────────────
function MapView({
  selectedCity,
  onSelectCity,
  mapMode,
}: {
  selectedCity: City | null
  onSelectCity: (city: City) => void
  mapMode: 'map' | 'satellite' | 'traffic'
}) {
  // Convert lat/lng to SVG coordinates (simplified projection)
  const toSvg = (lat: number, lng: number) => ({
    x: ((lng + 170) / 130) * 900,
    y: ((75 - lat) / 55) * 600,
  })

  return (
    <svg viewBox="0 0 900 600" className="w-full h-full">
      {/* Background */}
      <rect width="900" height="600" fill={mapMode === 'satellite' ? '#0a1628' : '#0d0d0d'} />

      {/* Grid lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <line
          key={`h${i}`}
          x1="0"
          y1={i * 30}
          x2="900"
          y2={i * 30}
          stroke={mapMode === 'satellite' ? '#1a3050' : '#1a1a1a'}
          strokeWidth="0.5"
        />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * 30}
          y1="0"
          x2={i * 30}
          y2="600"
          stroke={mapMode === 'satellite' ? '#1a3050' : '#1a1a1a'}
          strokeWidth="0.5"
        />
      ))}

      {/* Canada outline (simplified) */}
      <path
        d="M150,100 L200,80 L300,70 L400,60 L500,65 L550,80 L600,100 L650,90 L700,110
           L720,140 L700,170 L680,200 L650,210 L600,220 L550,230 L500,240 L450,235
           L400,230 L350,225 L300,230 L250,240 L200,235 L180,210 L160,180 L150,150 Z"
        fill={mapMode === 'satellite' ? '#0d2a1a' : '#1a0a00'}
        stroke="#ff660044"
        strokeWidth="1.5"
      />

      {/* USA outline (simplified) */}
      <path
        d="M150,240 L200,235 L250,240 L300,230 L350,225 L400,230 L450,235 L500,240
           L550,230 L600,220 L650,210 L680,230 L700,260 L720,300 L700,350 L680,380
           L650,400 L600,420 L550,430 L500,425 L450,420 L400,430 L350,440 L300,430
           L250,410 L200,380 L170,350 L150,310 L140,280 Z"
        fill={mapMode === 'satellite' ? '#0a1a2a' : '#0a0a1a'}
        stroke="#ff660033"
        strokeWidth="1.5"
      />

      {/* Border line */}
      <path
        d="M150,240 L200,235 L250,240 L300,230 L350,225 L400,230 L450,235 L500,240 L550,230 L600,220 L650,210"
        fill="none"
        stroke="#ff8c0066"
        strokeWidth="1"
        strokeDasharray="5,5"
      />

      {/* Country labels */}
      <text x="350" y="160" fill="#ff8c0044" fontSize="28" fontWeight="bold" fontFamily="monospace">
        CANADA
      </text>
      <text x="380" y="340" fill="#ff8c0044" fontSize="28" fontWeight="bold" fontFamily="monospace">
        USA
      </text>

      {/* Traffic overlay */}
      {mapMode === 'traffic' && (
        <>
          <path d="M450,235 L500,240 L530,250" stroke="#ff000088" strokeWidth="3" fill="none" />
          <path d="M300,230 L350,225 L400,230" stroke="#ffff0088" strokeWidth="3" fill="none" />
          <path d="M550,230 L600,220 L620,225" stroke="#00ff0088" strokeWidth="3" fill="none" />
        </>
      )}

      {/* City dots */}
      {CITIES.map((city) => {
        const pos = toSvg(city.lat, city.lng)
        const isSelected = selectedCity?.name === city.name
        const dotSize = Math.max(2, Math.min(6, city.population / 500000))

        return (
          <g
            key={city.name}
            onClick={() => onSelectCity(city)}
            style={{ cursor: 'pointer' }}
          >
            {/* Glow */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? dotSize + 8 : dotSize + 2}
              fill="none"
              stroke={isSelected ? '#ff8c00' : '#ff660044'}
              strokeWidth={isSelected ? 2 : 0.5}
            />
            {/* Pulse for selected */}
            {isSelected && (
              <>
                <circle cx={pos.x} cy={pos.y} r={dotSize + 12} fill="none" stroke="#ff8c0033" strokeWidth="1">
                  <animate attributeName="r" from={`${dotSize + 8}`} to={`${dotSize + 25}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}
            {/* Dot */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={dotSize}
              fill={isSelected ? '#ff8c00' : city.country === 'CA' ? '#ff6600' : '#cc5500'}
            />
            {/* Label */}
            {(isSelected || city.population > 1500000) && (
              <text
                x={pos.x + dotSize + 5}
                y={pos.y + 4}
                fill={isSelected ? '#ff8c00' : '#ff660088'}
                fontSize={isSelected ? '11' : '8'}
                fontFamily="monospace"
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {city.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── MAIN GPS PAGE ────────────────────────────────────────
const GpsMapPage: NextPageWithLayout = () => {
  const router = useRouter()
  const lang = (router.query.lang as LangCode) || 'fr'
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<City[]>([])
  const [mapMode, setMapMode] = useState<'map' | 'satellite' | 'traffic'>('map')
  const [showAI, setShowAI] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiTyping, setAiTyping] = useState(false)
  const [showNearby, setShowNearby] = useState<string | null>(null)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [currentLang, setCurrentLang] = useState<LangCode>(lang)

  // Search cities
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const q = searchQuery.toLowerCase()
    const results = CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.province?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q)
    ).slice(0, 8)
    setSearchResults(results)
  }, [searchQuery])

  // AI suggestion
  const triggerAI = useCallback(() => {
    setShowAI(true)
    setAiTyping(true)
    setAiMessage('')
    const suggestions = AI_SUGGESTIONS[currentLang] || AI_SUGGESTIONS.en
    const msg = suggestions[Math.floor(Math.random() * suggestions.length)]
    let i = 0
    const interval = setInterval(() => {
      if (i < msg.length) {
        setAiMessage((prev) => prev + msg[i])
        i++
      } else {
        clearInterval(interval)
        setAiTyping(false)
      }
    }, 30)
  }, [currentLang])

  // Calculate fake distance
  const getDistance = (a: City, b: City) => {
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

  return (
    <>
      <Head>
        <title>MARCEAU - {t(currentLang, 'gpsMap')}</title>
      </Head>

      <div className="fixed inset-0 bg-black overflow-hidden flex" style={{ fontFamily: "'Courier New', monospace" }}>
        {/* ─── LEFT SIDEBAR ─────────────────────────────── */}
        <div
          className="w-80 h-full flex flex-col border-r overflow-y-auto"
          style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.9)' }}
        >
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: '#ff660033' }}>
            <div className="flex items-center justify-between mb-3">
              <Link href={`/world?lang=${currentLang}`} passHref legacyBehavior>
                <a style={{ color: '#ff8c00' }} className="text-sm">← {t(currentLang, 'dashboard')}</a>
              </Link>
              {/* Language */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="text-xs px-2 py-1 border rounded"
                  style={{ borderColor: '#ff6600', color: '#ff8c00' }}
                >
                  🌐 {LANGUAGES[currentLang]}
                </button>
                {showLangMenu && (
                  <div
                    className="absolute right-0 mt-1 w-40 rounded border z-50 max-h-60 overflow-y-auto"
                    style={{ borderColor: '#ff6600', background: '#111' }}
                  >
                    {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                      <button
                        key={code}
                        className="block w-full text-left px-3 py-1 text-xs"
                        style={{ color: currentLang === code ? '#ff8c00' : '#666' }}
                        onClick={() => { setCurrentLang(code); setShowLangMenu(false) }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <h2
              className="text-xl font-bold mb-3"
              style={{ color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}
            >
              🗺️ {t(currentLang, 'gpsMap')}
            </h2>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={t(currentLang, 'searchLocation')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(255,100,0,0.1)',
                  border: '1px solid #ff660066',
                  color: '#ff8c00',
                }}
              />
              {searchResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-1 rounded-lg border z-50 max-h-60 overflow-y-auto"
                  style={{ borderColor: '#ff6600', background: '#111' }}
                >
                  {searchResults.map((city) => (
                    <button
                      key={city.name}
                      className="block w-full text-left px-3 py-2 text-sm border-b"
                      style={{ borderColor: '#ff660022', color: '#ff8c00' }}
                      onClick={() => {
                        setSelectedCity(city)
                        setSearchQuery(city.name)
                        setSearchResults([])
                      }}
                    >
                      <span className="font-bold">{city.name}</span>
                      <span className="ml-2 opacity-50">
                        {city.country === 'CA' ? `🇨🇦 ${city.province}` : `🇺🇸 ${city.state}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map mode buttons */}
          <div className="p-4 border-b flex gap-2" style={{ borderColor: '#ff660033' }}>
            {(['map', 'satellite', 'traffic'] as const).map((mode) => (
              <button
                key={mode}
                className="flex-1 py-1 px-2 rounded text-xs font-bold"
                style={{
                  background: mapMode === mode ? 'rgba(255,100,0,0.3)' : 'rgba(255,100,0,0.05)',
                  color: mapMode === mode ? '#ff8c00' : '#666',
                  border: `1px solid ${mapMode === mode ? '#ff6600' : '#ff660033'}`,
                }}
                onClick={() => setMapMode(mode)}
              >
                {mode === 'map' ? '🗺️' : mode === 'satellite' ? '🛰️' : '🚗'}
                {' '}{t(currentLang, mode === 'map' ? 'directions' : mode)}
              </button>
            ))}
          </div>

          {/* Selected city info */}
          {selectedCity && (
            <motion.div
              className="p-4 border-b"
              style={{ borderColor: '#ff660033' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-bold" style={{ color: '#ff8c00' }}>
                {selectedCity.country === 'CA' ? '🇨🇦' : '🇺🇸'} {selectedCity.name}
              </h3>
              <p className="text-xs mt-1" style={{ color: '#ff660088' }}>
                {selectedCity.province || selectedCity.state},{' '}
                {selectedCity.country === 'CA' ? t(currentLang, 'canada') : t(currentLang, 'usa')}
              </p>
              <p className="text-xs mt-1" style={{ color: '#ff660066' }}>
                Pop: {selectedCity.population.toLocaleString()}
              </p>
              <p className="text-xs mt-1" style={{ color: '#ff660066' }}>
                📍 {selectedCity.lat.toFixed(2)}, {selectedCity.lng.toFixed(2)}
              </p>

              {/* Distance from Montreal (home base) */}
              <div className="mt-3 p-2 rounded" style={{ background: 'rgba(255,100,0,0.1)' }}>
                <p className="text-xs" style={{ color: '#ff8c00' }}>
                  📏 Montreal → {selectedCity.name}:{' '}
                  <strong>{getDistance(CITIES[0], selectedCity)} km</strong>
                </p>
                <p className="text-xs mt-1" style={{ color: '#ff660088' }}>
                  {t(currentLang, 'estimatedTime')}: ~{Math.round(getDistance(CITIES[0], selectedCity) / 100)}h
                </p>
              </div>
            </motion.div>
          )}

          {/* Nearby categories */}
          <div className="p-4 border-b" style={{ borderColor: '#ff660033' }}>
            <h4 className="text-sm font-bold mb-2" style={{ color: '#ff8c00' }}>
              {t(currentLang, 'nearby')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'restaurants' as const, icon: '🍔' },
                { key: 'gasStations' as const, icon: '⛽' },
                { key: 'hospitals' as const, icon: '🏥' },
                { key: 'hotels' as const, icon: '🏨' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  className="p-2 rounded text-xs text-left"
                  style={{
                    background: showNearby === cat.key ? 'rgba(255,100,0,0.2)' : 'rgba(255,100,0,0.05)',
                    color: '#ff8c00',
                    border: `1px solid ${showNearby === cat.key ? '#ff6600' : '#ff660033'}`,
                  }}
                  onClick={() => setShowNearby(showNearby === cat.key ? null : cat.key)}
                >
                  {cat.icon} {t(currentLang, cat.key)}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestion button */}
          <div className="p-4">
            <button
              className="w-full py-3 rounded-lg font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255,100,0,0.3), rgba(255,60,0,0.1))',
                color: '#ff8c00',
                border: '1px solid #ff6600',
                textShadow: '0 0 10px #ff6600',
              }}
              onClick={triggerAI}
            >
              🤖 {t(currentLang, 'aiSuggestion')}
            </button>

            {/* AI message */}
            <AnimatePresence>
              {showAI && (
                <motion.div
                  className="mt-3 p-3 rounded-lg"
                  style={{ background: 'rgba(255,100,0,0.1)', border: '1px solid #ff660044' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs" style={{ color: '#ff8c00' }}>
                    🤖 {aiMessage}
                    {aiTyping && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── MAP AREA ─────────────────────────────────── */}
        <div className="flex-1 relative">
          <MapView
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            mapMode={mapMode}
          />

          {/* Mini Music Player */}
          <MiniMusicPlayer />

          {/* Compass */}
          <div
            className="absolute top-4 right-4 w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#ff6600', background: 'rgba(0,0,0,0.8)' }}
          >
            <span style={{ color: '#ff8c00', fontSize: '10px', fontWeight: 'bold' }}>N</span>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <button
              className="w-10 h-10 rounded border flex items-center justify-center text-xl"
              style={{ borderColor: '#ff6600', background: 'rgba(0,0,0,0.8)', color: '#ff8c00' }}
            >
              +
            </button>
            <button
              className="w-10 h-10 rounded border flex items-center justify-center text-xl"
              style={{ borderColor: '#ff6600', background: 'rgba(0,0,0,0.8)', color: '#ff8c00' }}
            >
              -
            </button>
          </div>

          {/* Coordinates display */}
          <div
            className="absolute bottom-4 left-4 px-3 py-1 rounded text-xs"
            style={{ background: 'rgba(0,0,0,0.8)', color: '#ff660088', border: '1px solid #ff660033' }}
          >
            {selectedCity
              ? `📍 ${selectedCity.lat.toFixed(4)}, ${selectedCity.lng.toFixed(4)}`
              : '📍 45.5017, -73.5673 (Montreal)'}
          </div>

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)',
            }}
          />
        </div>
      </div>
    </>
  )
}

GpsMapPage.getLayout = (page) => page

export default GpsMapPage
