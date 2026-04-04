import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

// ─── MATRIX RAIN COLUMN (orange) ──────────────────────────
function MatrixColumn({ delay, speed, left }: { delay: number; speed: number; left: string }) {
  const chars = 'アカサタナハマヤラワ0123456789MARCEAU'.split('')
  const [text, setText] = useState('')

  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const interval = setInterval(() => {
        setText((prev) => {
          const next = prev + chars[Math.floor(Math.random() * chars.length)] + '\n'
          if (next.length > 400) return ''
          return next
        })
      }, speed)
      // cleanup after 60s to save memory
      setTimeout(() => clearInterval(interval), 60000)
    }, delay)
  }

  return (
    <div
      className="absolute top-0 font-mono text-[10px] leading-tight whitespace-pre pointer-events-none"
      style={{ left, color: '#ff8c00', opacity: 0.15, textShadow: '0 0 4px #ff6600' }}
    >
      {text}
    </div>
  )
}

const MENU_ITEMS = [
  { key: 'gpsMap' as const, href: '/world/gps-map', icon: '🗺️', color: '#00ff88' },
  { key: 'tilexal' as const, href: '/world/tilexal', icon: '🪶', color: '#ff8c00' },
  { key: 'settings' as const, href: '#', icon: '⚙️', color: '#888888' },
]

const WorldDashboard: NextPageWithLayout = () => {
  const [lang, setLang] = useState<LangCode>('fr')
  const [showLangMenu, setShowLangMenu] = useState(false)

  const matrixColumns = Array.from({ length: 25 }, (_, i) => (
    <MatrixColumn
      key={i}
      delay={Math.random() * 3000}
      speed={60 + Math.random() * 100}
      left={`${(i / 25) * 100}%`}
    />
  ))

  return (
    <>
      <Head>
        <title>MARCEAU - {t(lang, 'dashboard')}</title>
      </Head>

      <div className="fixed inset-0 bg-black overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
        {/* Matrix rain background */}
        <div className="absolute inset-0 overflow-hidden">{matrixColumns}</div>

        {/* Language selector - top right */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="px-4 py-2 border rounded-lg font-bold text-sm"
            style={{
              borderColor: '#ff6600',
              color: '#ff8c00',
              background: 'rgba(255, 100, 0, 0.1)',
              textShadow: '0 0 8px #ff6600',
            }}
          >
            🌐 {LANGUAGES[lang]}
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                className="absolute right-0 mt-2 w-48 rounded-lg border overflow-hidden"
                style={{
                  borderColor: '#ff6600',
                  background: 'rgba(0, 0, 0, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
                initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                  <button
                    key={code}
                    className="block w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color: lang === code ? '#ff8c00' : '#888',
                      background: lang === code ? 'rgba(255, 100, 0, 0.15)' : 'transparent',
                    }}
                    onClick={() => {
                      setLang(code)
                      setShowLangMenu(false)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 100, 0, 0.1)'
                      e.currentTarget.style.color = '#ff8c00'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = lang === code ? 'rgba(255, 100, 0, 0.15)' : 'transparent'
                      e.currentTarget.style.color = lang === code ? '#ff8c00' : '#888'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {/* Title */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-6xl font-black mb-3"
              style={{
                color: '#ff8c00',
                textShadow: '0 0 30px #ff6600, 0 0 60px #ff4500, 0 2px 0 #8B4513, 0 4px 0 #654321',
              }}
            >
              MARCEAU
            </h1>
            <p className="text-lg" style={{ color: '#ff6600', opacity: 0.7 }}>
              {t(lang, 'dashboard')}
            </p>
          </motion.div>

          {/* App grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl px-8">
            {MENU_ITEMS.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
              >
                <Link href={`${item.href}?lang=${lang}`} passHref legacyBehavior>
                  <motion.a
                    className="block p-8 border-2 rounded-xl text-center cursor-pointer"
                    style={{
                      borderColor: '#ff6600',
                      background: 'rgba(255, 100, 0, 0.05)',
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: `0 0 40px ${item.color}33, 0 0 80px ${item.color}11`,
                      borderColor: item.color,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <div
                      className="text-xl font-bold"
                      style={{
                        color: '#ff8c00',
                        textShadow: '0 0 10px #ff6600',
                      }}
                    >
                      {t(lang, item.key)}
                    </div>
                  </motion.a>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Back to welcome */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <Link href="/welcome" passHref legacyBehavior>
              <a
                className="text-sm underline"
                style={{ color: '#ff660088' }}
              >
                ← {t(lang, 'logout')}
              </a>
            </Link>
          </motion.div>
        </div>

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)',
          }}
        />
      </div>
    </>
  )
}

WorldDashboard.getLayout = (page) => page

export default WorldDashboard
